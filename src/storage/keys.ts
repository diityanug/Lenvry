/**
 * Single source of truth for every AsyncStorage key owned by the app.
 *
 * IMPORTANT: the string values below are kept byte-for-byte identical to the
 * legacy names (`@wakemove_*`, `@finance_*`, `@lenvry_*`). Renaming them would
 * orphan the data already written on users' devices and invalidate every
 * backup file they exported. Treat these values as frozen.
 */
export const STORAGE_KEYS = {
  userName: '@wakemove_user_name',

  financeTransactions: '@finance_tx',
  financeAccounts: '@finance_acc',
  financeExpenseCategories: '@finance_exp_cat',
  financeIncomeCategories: '@finance_inc_cat',
  financeCategoryBudgets: '@finance_category_budgets',
  financeRecurringBills: '@finance_recurring',
  financeCustomCategoryIcons: '@finance_custom_cat_icons',

  habits: '@lenvry_habits',
  habitCategories: '@lenvry_habit_categories',
  habitCategoryIcons: '@lenvry_habit_category_icons',
  notificationSettings: '@lenvry_habit_notification_settings',

  fitnessWorkouts: '@fitness_workouts',
  fitnessInstallDate: '@fitness_install_date',

  nutritionLogs: '@wakemove_nutrition_logs',
  nutritionTargets: '@wakemove_nutrition_targets',
  customFoods: '@wakemove_custom_foods',
  waterLogs: '@wakemove_water_logs',

  generalNotes: '@lenvry_general_notes',

  /** Internal: shape version of the persisted data. */
  schemaVersion: '@lenvry_schema_version',
} as const;

export type StorageKeyName = keyof typeof STORAGE_KEYS;

/** Storage keys whose name carries no domain payload (bookkeeping only). */
export const META_KEY_NAMES = ['schemaVersion'] as const satisfies readonly StorageKeyName[];

/**
 * Keys written by earlier builds that no longer have a reader in the app
 * (e.g. the abandoned step counter). They are still exported, restored and
 * cleared so nothing the user ever stored gets silently dropped.
 */
export const LEGACY_STORAGE_KEYS = ['@lenvry_steps_logs'] as const;

/** Every storage key this app may have written, in any version. */
export const ALL_APP_STORAGE_KEYS: readonly string[] = [
  ...Object.values(STORAGE_KEYS),
  ...LEGACY_STORAGE_KEYS,
];
