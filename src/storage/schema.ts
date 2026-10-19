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
import { Account, CategoryBudget, CategoryCustomIcon, DebtItem, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, RecurringBill, Transaction } from '../types/finance';
import { Workout } from '../types/fitness';
import { Habit } from '../types/habits';
import { StickyNote } from '../types/notes';
import { LearningCourse } from '../types/learning';
import { DEFAULT_NUTRITION_TARGET, FoodItem, NutritionLog, NutritionTarget, WaterLog } from '../types/nutrition';
import { DEFAULT_NOTIFICATION_SETTINGS, NotificationSettings } from '../types/settings';
import { META_KEY_NAMES, STORAGE_KEYS, StorageKeyName } from './keys';
import {
  AccountSchema,
  CategoryBudgetSchema,
  CategoryCustomIconSchema,
  DebtItemSchema,
  FoodItemSchema,
  HabitSchema,
  LearningCourseSchema,
  NotificationSettingsSchema,
  NutritionLogSchema,
  NutritionTargetSchema,
  RecurringBillSchema,
  StickyNoteSchema,
  TransactionSchema,
  WaterLogSchema,
  WorkoutSchema,
} from './zodSchemas';

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
  financeDebts: DebtItem[];

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
  learningCourses: LearningCourse[];

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

const num = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const strArray = (value: unknown): string[] =>
  (Array.isArray(value) ? value : []).filter((item): item is string => typeof item === 'string');

/** Non-empty, de-duplicated list of strings (used for categories). */
const uniqueStrArray = (value: unknown): string[] =>
  Array.from(new Set(strArray(value).filter((s) => s.trim().length > 0)));

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
  financeDebts: [],

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
  learningCourses: [],

  schemaVersion: SCHEMA_VERSION,
};

/** Turns an arbitrary (already JSON-parsed) value into a valid row. */
type Parser<K extends StorageKeyName> = (value: unknown) => StorageMap[K];

export const PARSERS: { [K in StorageKeyName]: Parser<K> } = {
  userName: (value) => {
    const parsed = str(value, 'User');
    return parsed.trim().length > 0 ? parsed : 'User';
  },

  financeTransactions: (value) =>
    records(value).map((item) => TransactionSchema.parse(item) as Transaction),
  financeAccounts: (value) =>
    records(value).map((item) => AccountSchema.parse(item) as Account),
  financeExpenseCategories: (value) => uniqueStrArray(value),
  financeIncomeCategories: (value) => uniqueStrArray(value),
  financeCategoryBudgets: (value) =>
    records(value).map((item) => CategoryBudgetSchema.parse(item) as CategoryBudget),
  financeRecurringBills: (value) =>
    records(value).map((item) => RecurringBillSchema.parse(item) as RecurringBill),
  financeCustomCategoryIcons: (value) =>
    records(value).map((item) => CategoryCustomIconSchema.parse(item) as CategoryCustomIcon),
  financeDebts: (value) =>
    records(value).map((item) => DebtItemSchema.parse(item) as DebtItem),

  habits: (value) =>
    records(value).map((item) => HabitSchema.parse(item) as Habit),
  habitCategories: (value) => uniqueStrArray(value),
  habitCategoryIcons: parseHabitCategoryIcons,
  notificationSettings: (value) =>
    NotificationSettingsSchema.parse(isRecord(value) ? value : {}) as NotificationSettings,

  fitnessWorkouts: (value) =>
    records(value).map((item) => WorkoutSchema.parse(item) as Workout),
  fitnessInstallDate: (value) => str(value),

  nutritionLogs: (value) =>
    records(value).map((item) => NutritionLogSchema.parse(item) as NutritionLog),
  nutritionTargets: (value) => {
    const source = Array.isArray(value) ? value[0] : value;
    return NutritionTargetSchema.parse(isRecord(source) ? source : {}) as NutritionTarget;
  },
  customFoods: (value) =>
    records(value).map((item) => FoodItemSchema.parse(item) as FoodItem),
  waterLogs: (value) =>
    records(value).map((item) => WaterLogSchema.parse(item) as WaterLog),

  generalNotes: (value) =>
    records(value).map((item) => StickyNoteSchema.parse(item) as StickyNote),

  learningCourses: (value) =>
    records(value).map((item) => LearningCourseSchema.parse(item) as LearningCourse),

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
