/**
 * Persisted data schema.
 *
 * Every value the app stores is described here exactly once: its TypeScript
 * shape, its default, and a parser that turns *unknown* storage content into a
 * valid value. The parsers are the replacement for the ad-hoc normalisation
 * that used to live in each screen (`{ ...a, currency: a.currency || 'IDR' }`
 * style patches), so corrupt or outdated rows can no longer reach the UI.
 *
 * Parsers must be total: they never throw, they always return a valid value.
 */
import { DEFAULT_CATEGORIES } from '../constants/habits';
import { Account, CategoryBudget, CategoryCustomIcon, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, RecurringBill, Transaction } from '../types/finance';
import { Workout } from '../types/fitness';
import { FrequencyType, Habit, PriorityLevel, SubTask, TimeSlot } from '../types/habits';
import { ChecklistItem, NoteCategory, NOTE_CATEGORIES, StickyNote, StickyNoteColor } from '../types/notes';
import { DEFAULT_NUTRITION_TARGET, FoodCategory, FoodItem, MealType, NutritionLog, NutritionTarget, WaterLog } from '../types/nutrition';
import { DEFAULT_NOTIFICATION_SETTINGS, NotificationSettings } from '../types/settings';
import { META_KEY_NAMES, STORAGE_KEYS, StorageKeyName } from './keys';

// ---------------------------------------------------------------------------
// Version
// ---------------------------------------------------------------------------

/**
 * Bump whenever a parser starts producing a different shape, and add a matching
 * entry to MIGRATIONS. Version 1 is the introduction of this schema layer:
 * migration 1 simply runs every legacy row through its parser once.
 */
export const SCHEMA_VERSION = 1;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Category icon override used by the habit tracker (icon/colour only). */
export interface HabitCategoryIconStyle {
  icon: string;
  color: string;
  bg: string;
}

export type HabitCategoryIconMap = Record<string, HabitCategoryIconStyle>;

/**
 * The complete shape of persisted app data. `keyof StorageMap` is the only set
 * of names any caller may pass to the storage API.
 */
export interface StorageMap {
  userName: string;

  financeTransactions: Transaction[];
  financeAccounts: Account[];
  financeExpenseCategories: string[];
  financeIncomeCategories: string[];
  financeCategoryBudgets: CategoryBudget[];
  financeRecurringBills: RecurringBill[];
  financeCustomCategoryIcons: CategoryCustomIcon[];

  habits: Habit[];
  habitCategories: string[];
  habitCategoryIcons: HabitCategoryIconMap;
  notificationSettings: NotificationSettings;

  fitnessWorkouts: Workout[];
  fitnessInstallDate: string;

  nutritionLogs: NutritionLog[];
  nutritionTargets: NutritionTarget;
  customFoods: FoodItem[];
  waterLogs: WaterLog[];

  generalNotes: StickyNote[];

  schemaVersion: number;
}

/** Names that carry real user data (everything except bookkeeping keys). */
export type DataKeyName = Exclude<StorageKeyName, (typeof META_KEY_NAMES)[number]>;

// ---------------------------------------------------------------------------
// Primitive coercion helpers
// ---------------------------------------------------------------------------

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Only the object entries of an unknown value. */
const records = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

const str = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
};

/** Optional string: empty/absent becomes undefined instead of ''. */
const optStr = (value: unknown): string | undefined => {
  const parsed = str(value);
  return parsed.length > 0 ? parsed : undefined;
};

const num = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const bool = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

const strArray = (value: unknown): string[] =>
  (Array.isArray(value) ? value : []).filter((item): item is string => typeof item === 'string');

/** Non-empty, de-duplicated list of strings (used for categories). */
const uniqueStrArray = (value: unknown): string[] => Array.from(new Set(strArray(value).filter((s) => s.trim().length > 0)));

let idCounter = 0;
const uid = (prefix: string): string => {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const todayKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
};

// ---------------------------------------------------------------------------
// Domain parsers
// ---------------------------------------------------------------------------

const parseSubTask = (value: unknown): SubTask => {
  const item = isRecord(value) ? value : {};
  return {
    id: str(item.id) || uid('sub'),
    title: str(item.title),
    completed: bool(item.completed, false),
  };
};

const HABIT_PRIORITIES: readonly PriorityLevel[] = ['low', 'medium', 'high'];
const HABIT_TIME_SLOTS: readonly TimeSlot[] = ['Anytime', 'Morning', 'Afternoon', 'Evening'];
const HABIT_FREQUENCIES: readonly FrequencyType[] = ['once', 'daily', 'weekdays', 'custom_days'];

/**
 * Habit rows are the most patched payload in the app: rows written before
 * recurring habits existed have no `completedDates`/`frequency` at all.
 */
const parseHabit = (value: unknown): Habit => {
  const item = isRecord(value) ? value : {};
  return {
    id: str(item.id) || uid('habit'),
    title: str(item.title, 'Untitled'),
    category: str(item.category, DEFAULT_CATEGORIES[0]),
    completed: bool(item.completed, false),
    date: str(item.date) || todayKey(),
    description: optStr(item.description),
    priority: oneOf(item.priority, HABIT_PRIORITIES, 'medium'),
    timeSlot: oneOf(item.timeSlot, HABIT_TIME_SLOTS, 'Anytime'),
    reminderTime: optStr(item.reminderTime),
    reminderSound: optStr(item.reminderSound),
    notificationId: optStr(item.notificationId),
    frequency: oneOf(item.frequency, HABIT_FREQUENCIES, 'once'),
    repeatDays: (Array.isArray(item.repeatDays) ? item.repeatDays : [])
      .map((day) => num(day, -1))
      .filter((day) => day >= 0 && day <= 6),
    completedDates: strArray(item.completedDates),
    subtasks: records(item.subtasks).map(parseSubTask),
    extraNotes: strArray(item.extraNotes),
  };
};

const parseAccount = (value: unknown): Account => {
  const item = isRecord(value) ? value : {};
  const subAccounts = records(item.subAccounts).map((sub) => ({
    id: str(sub.id) || uid('sub'),
    name: str(sub.name, 'Main'),
  }));
  return {
    id: str(item.id) || uid('acc'),
    name: str(item.name, 'Account'),
    description: optStr(item.description),
    type: oneOf(item.type, ['Bank', 'E-Wallet', 'Cash', 'Investment', 'Credit Card', 'E-Money'], 'Cash'),
    currency: oneOf(item.currency, ['IDR', 'USD'], 'IDR'),
    subAccounts: subAccounts.length > 0 ? subAccounts : [{ id: uid('sub'), name: 'Main' }],
  };
};

const parseTransaction = (value: unknown): Transaction => {
  const item = isRecord(value) ? value : {};
  return {
    id: str(item.id) || uid('tx'),
    type: oneOf(item.type, ['income', 'expense', 'transfer'], 'expense'),
    amount: num(item.amount, 0),
    description: str(item.description),
    category: str(item.category, 'Others'),
    date: str(item.date) || new Date().toISOString(),
    accountId: str(item.accountId),
    subAccountId: str(item.subAccountId),
    toAccountId: optStr(item.toAccountId),
    toSubAccountId: optStr(item.toSubAccountId),
  };
};

const parseCategoryBudget = (value: unknown): CategoryBudget => {
  const item = isRecord(value) ? value : {};
  return { category: str(item.category), limit: num(item.limit, 0) };
};

const parseCategoryCustomIcon = (value: unknown): CategoryCustomIcon => {
  const item = isRecord(value) ? value : {};
  return {
    category: str(item.category),
    icon: str(item.icon),
    color: optStr(item.color),
    bg: optStr(item.bg),
  };
};

const parseRecurringBill = (value: unknown): RecurringBill => {
  const item = isRecord(value) ? value : {};
  return {
    id: str(item.id) || uid('bill'),
    name: str(item.name, 'Bill'),
    amount: num(item.amount, 0),
    category: str(item.category, 'Bills & Utilities'),
    dueDateDay: Math.min(31, Math.max(1, Math.round(num(item.dueDateDay, 1)))),
    currency: oneOf(item.currency, ['IDR', 'USD'], 'IDR'),
  };
};

const parseHabitCategoryIcons = (value: unknown): HabitCategoryIconMap => {
  const source = isRecord(value) ? value : {};
  const result: HabitCategoryIconMap = {};
  Object.entries(source).forEach(([category, style]) => {
    const item = isRecord(style) ? style : {};
    if (!item.icon) return;
    result[category] = {
      icon: str(item.icon),
      color: str(item.color, '#94A3B8'),
      bg: str(item.bg, 'rgba(148, 163, 184, 0.16)'),
    };
  });
  return result;
};

const parseWorkout = (value: unknown): Workout => {
  const item = isRecord(value) ? value : {};
  return {
    id: str(item.id) || uid('workout'),
    exercise: str(item.exercise, 'Exercise'),
    category: str(item.category, 'Others'),
    // Originally stored as numbers by an early build, now free-text ("12", "12 kg").
    sets: str(item.sets),
    reps: str(item.reps),
    weight: str(item.weight),
    date: str(item.date) || todayKey(),
  };
};

const MEAL_TYPES: readonly MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const parseNutritionLog = (value: unknown): NutritionLog => {
  const item = isRecord(value) ? value : {};
  return {
    id: str(item.id) || uid('log'),
    date: str(item.date) || todayKey(),
    mealType: oneOf(item.mealType, MEAL_TYPES, 'snack'),
    foodId: optStr(item.foodId),
    foodName: str(item.foodName, 'Food'),
    portionGrams: num(item.portionGrams, 0),
    servingDescription: str(item.servingDescription),
    calories: num(item.calories, 0),
    protein: num(item.protein, 0),
    carbs: num(item.carbs, 0),
    fat: num(item.fat, 0),
    createdAt: str(item.createdAt) || new Date().toISOString(),
  };
};

const FOOD_CATEGORIES: readonly FoodCategory[] = [
  'Staples',
  'Proteins',
  'Vegetables',
  'Fruits',
  'Dairy & Drinks',
  'Snacks',
  'Custom',
];

const parseFoodItem = (value: unknown): FoodItem => {
  const item = isRecord(value) ? value : {};
  return {
    id: str(item.id) || uid('food'),
    name: str(item.name, 'Food'),
    indonesianName: optStr(item.indonesianName),
    category: oneOf(item.category, FOOD_CATEGORIES, 'Custom'),
    calories: num(item.calories, 0),
    protein: num(item.protein, 0),
    carbs: num(item.carbs, 0),
    fat: num(item.fat, 0),
    fiber: item.fiber === undefined ? undefined : num(item.fiber, 0),
    defaultServingText: str(item.defaultServingText, '100 g'),
    defaultServingGrams: num(item.defaultServingGrams, 100),
    isCustom: item.isCustom === undefined ? undefined : bool(item.isCustom, false),
  };
};

const parseNutritionTarget = (value: unknown): NutritionTarget => {
  // Defensive: an early build wrote an array here, and the key is plural.
  const source = Array.isArray(value) ? value[0] : value;
  const item = isRecord(source) ? source : {};
  return {
    calories: num(item.calories, DEFAULT_NUTRITION_TARGET.calories),
    protein: num(item.protein, DEFAULT_NUTRITION_TARGET.protein),
    carbs: num(item.carbs, DEFAULT_NUTRITION_TARGET.carbs),
    fat: num(item.fat, DEFAULT_NUTRITION_TARGET.fat),
  };
};

const parseWaterLog = (value: unknown): WaterLog => {
  const item = isRecord(value) ? value : {};
  return {
    date: str(item.date) || todayKey(),
    amountMl: Math.max(0, num(item.amountMl, 0)),
    targetMl: Math.max(0, num(item.targetMl, 2000)),
  };
};

const parseChecklistItem = (value: unknown): ChecklistItem => {
  const item = isRecord(value) ? value : {};
  return {
    id: str(item.id) || uid('chk'),
    text: str(item.text, str(item.title)),
    done: bool(item.done, bool(item.completed, false)),
  };
};

const STICKY_COLORS: readonly StickyNoteColor[] = ['amber', 'blue', 'emerald', 'rose', 'purple'];
const NOTE_CATEGORY_KEYS = Object.keys(NOTE_CATEGORIES) as NoteCategory[];

/**
 * Notes have the messiest history: `description` used to be `content`, ids and
 * timestamps were optional, and a note without a category is still valid.
 */
const parseStickyNote = (value: unknown): StickyNote => {
  const item = isRecord(value) ? value : {};
  const checklist = records(item.checklist).map(parseChecklistItem);
  const type = oneOf(item.type, ['text', 'checklist'], checklist.length > 0 ? 'checklist' : 'text');
  const createdAt = str(item.createdAt) || new Date().toISOString();
  const category =
    typeof item.category === 'string' && (NOTE_CATEGORY_KEYS as string[]).includes(item.category)
      ? (item.category as NoteCategory)
      : undefined;
  return {
    id: str(item.id) || uid('note'),
    title: str(item.title, 'Note'),
    type,
    category,
    description: str(item.description ?? item.content),
    checklist,
    color: oneOf(item.color, STICKY_COLORS, 'amber'),
    createdAt,
    updatedAt: str(item.updatedAt) || createdAt,
  };
};

const parseNotificationSettings = (value: unknown): NotificationSettings => {
  const item = isRecord(value) ? value : {};
  return {
    enabled: bool(item.enabled, DEFAULT_NOTIFICATION_SETTINGS.enabled),
    defaultSound: str(item.defaultSound, DEFAULT_NOTIFICATION_SETTINGS.defaultSound),
    vibrate: bool(item.vibrate, DEFAULT_NOTIFICATION_SETTINGS.vibrate),
    fullScreenAlarm: bool(item.fullScreenAlarm, DEFAULT_NOTIFICATION_SETTINGS.fullScreenAlarm),
  };
};

// ---------------------------------------------------------------------------
// Schema table
// ---------------------------------------------------------------------------

/**
 * Per-key defaults, used when a row has never been written. `financeAccounts`
 * defaults to an empty list rather than a seeded account: callers that want to
 * create a first account must detect the missing row with `readStored`, which
 * returns `null` for keys that were never persisted.
 */
export const DEFAULTS: { [K in StorageKeyName]: StorageMap[K] } = {
  userName: 'User',

  financeTransactions: [],
  financeAccounts: [],
  financeExpenseCategories: DEFAULT_EXPENSE_CATEGORIES,
  financeIncomeCategories: DEFAULT_INCOME_CATEGORIES,
  financeCategoryBudgets: [],
  financeRecurringBills: [],
  financeCustomCategoryIcons: [],

  habits: [],
  habitCategories: DEFAULT_CATEGORIES,
  habitCategoryIcons: {},
  notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,

  fitnessWorkouts: [],
  fitnessInstallDate: '',

  nutritionLogs: [],
  nutritionTargets: DEFAULT_NUTRITION_TARGET,
  customFoods: [],
  waterLogs: [],

  generalNotes: [],

  schemaVersion: SCHEMA_VERSION,
};

/** Turns an arbitrary (already JSON-parsed) value into a valid row. */
type Parser<K extends StorageKeyName> = (value: unknown) => StorageMap[K];

export const PARSERS: { [K in StorageKeyName]: Parser<K> } = {
  userName: (value) => {
    const parsed = str(value, 'User');
    return parsed.trim().length > 0 ? parsed : 'User';
  },

  financeTransactions: (value) => records(value).map(parseTransaction),
  financeAccounts: (value) => records(value).map(parseAccount),
  financeExpenseCategories: (value) => uniqueStrArray(value),
  financeIncomeCategories: (value) => uniqueStrArray(value),
  financeCategoryBudgets: (value) => records(value).map(parseCategoryBudget),
  financeRecurringBills: (value) => records(value).map(parseRecurringBill),
  financeCustomCategoryIcons: (value) => records(value).map(parseCategoryCustomIcon),

  habits: (value) => records(value).map(parseHabit),
  habitCategories: (value) => uniqueStrArray(value),
  habitCategoryIcons: parseHabitCategoryIcons,
  notificationSettings: parseNotificationSettings,

  fitnessWorkouts: (value) => records(value).map(parseWorkout),
  fitnessInstallDate: (value) => str(value),

  nutritionLogs: (value) => records(value).map(parseNutritionLog),
  nutritionTargets: parseNutritionTarget,
  customFoods: (value) => records(value).map(parseFoodItem),
  waterLogs: (value) => records(value).map(parseWaterLog),

  generalNotes: (value) => records(value).map(parseStickyNote),

  schemaVersion: (value) => Math.max(0, Math.round(num(value, 0))),
};

/**
 * `userName` was historically written as a bare string rather than JSON, so it
 * needs its own decoder. Everything else is plain JSON.
 */
export const isRawStringKey = (name: StorageKeyName): boolean => name === 'userName';

/** Decodes a raw AsyncStorage string into a validated value. */
export function decodeRow<K extends StorageKeyName>(name: K, raw: string): StorageMap[K] {
  if (isRawStringKey(name)) {
    const trimmed = raw.trim();
    if (trimmed.startsWith('"')) {
      try {
        return PARSERS[name](JSON.parse(trimmed));
      } catch {
        // fall through to the raw value below
      }
    }
    return PARSERS[name](raw);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = undefined;
  }
  return PARSERS[name](parsed);
}

/** Encodes a validated value for AsyncStorage (inverse of decodeRow). */
export function encodeRow<K extends StorageKeyName>(name: K, value: StorageMap[K]): string {
  return isRawStringKey(name) ? String(value) : JSON.stringify(value);
}

export const DATA_KEY_NAMES = (Object.keys(STORAGE_KEYS) as StorageKeyName[]).filter(
  (name): name is DataKeyName => !(META_KEY_NAMES as readonly StorageKeyName[]).includes(name)
);
