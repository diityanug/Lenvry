import * as SQLite from 'expo-sqlite';
import { FoodItem, FoodCategory } from '../types/nutrition';
import foodsSeedData from '../../assets/data/foods_seed.json';
import { shouldSeedBundledFoods } from '../utils/foodSeedValidation';

interface FoodRow {
  id: string;
  name: string;
  indonesian_name: string | null;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  default_serving_text: string;
  default_serving_grams: number;
  is_custom: number;
}

const INSERT_FOOD_NAMED_SQL = `
  INSERT OR REPLACE INTO foods (
    id, name, indonesian_name, category, calories, protein, carbs, fat, fiber,
    default_serving_text, default_serving_grams, is_custom
  ) VALUES (
    $id, $name, $indonesianName, $category, $calories, $protein, $carbs, $fat, $fiber,
    $defaultServingText, $defaultServingGrams, $isCustom
  );
`;

function toFoodInsertParams(item: FoodItem, isCustom: 0 | 1) {
  return {
    $id: item.id,
    $name: item.name,
    $indonesianName: item.indonesianName || null,
    $category: item.category,
    $calories: item.calories,
    $protein: item.protein,
    $carbs: item.carbs,
    $fat: item.fat,
    $fiber: item.fiber !== undefined ? item.fiber : null,
    $defaultServingText: item.defaultServingText,
    $defaultServingGrams: item.defaultServingGrams,
    $isCustom: isCustom,
  };
}

// Bundled fallback seed version; increment only when modifying the bundled asset in an APK build.
export const BUNDLED_SEED_VERSION = 7;

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getNutritionDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = await SQLite.openDatabaseAsync('lenvry.db');
    await db.execAsync('PRAGMA journal_mode = WAL;');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS foods (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        indonesian_name TEXT,
        category TEXT NOT NULL,
        calories REAL NOT NULL,
        protein REAL NOT NULL,
        carbs REAL NOT NULL,
        fat REAL NOT NULL,
        fiber REAL,
        default_serving_text TEXT NOT NULL,
        default_serving_grams REAL NOT NULL,
        is_custom INTEGER DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category);
      CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);
      CREATE INDEX IF NOT EXISTS idx_foods_is_custom ON foods(is_custom);
    `);

    const versionResult = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
    const currentDbVersion = versionResult?.user_version ?? 0;

    const countResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM foods WHERE is_custom = 0;'
    );
    const masterItemsCount = (foodsSeedData as FoodItem[]).length;
    const masterCount = countResult?.count ?? 0;

    // Only re-seed bundled JSON on upgrades/empty DB; preserve newer remote OTA seeds.
    if (
      shouldSeedBundledFoods(
        currentDbVersion,
        masterCount,
        masterItemsCount,
        BUNDLED_SEED_VERSION
      )
    ) {
      await seedMasterFoods(db);
      await db.execAsync(`PRAGMA user_version = ${BUNDLED_SEED_VERSION};`);
    }

    dbInstance = db;
    return db;
  })().catch((err) => {
    // Allow retries on subsequent calls if initialization failed transiently.
    initPromise = null;
    throw err;
  });

  return initPromise;
}

/** Return the active master food seed version and master row count in SQLite. */
export async function getMasterFoodSeedInfo(): Promise<{ version: number; count: number }> {
  const db = await getNutritionDb();
  const versionResult = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const countResult = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM foods WHERE is_custom = 0;'
  );
  return {
    version: versionResult?.user_version ?? 0,
    count: countResult?.count ?? 0,
  };
}

/**
 * Atomically replace master food rows (is_custom = 0) with a validated remote seed payload
 * while preserving all custom user foods (is_custom = 1).
 */
export async function applyRemoteFoodSeed(items: FoodItem[], version: number): Promise<number> {
  if (!Number.isInteger(version) || version < 1) {
    throw new Error(`Invalid seed version: ${version}`);
  }
  if (items.length === 0) {
    throw new Error('Cannot apply an empty food seed payload.');
  }

  const db = await getNutritionDb();
  await seedMasterFoods(db, items);
  await db.execAsync(`PRAGMA user_version = ${version};`);
  return items.length;
}

async function seedMasterFoods(
  db: SQLite.SQLiteDatabase,
  masterItems: FoodItem[] = foodsSeedData as FoodItem[]
) {

  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM foods WHERE is_custom = 0;');

    const insertStmt = await db.prepareAsync(INSERT_FOOD_NAMED_SQL);
    try {
      for (const item of masterItems) {
        await insertStmt.executeAsync(toFoodInsertParams(item, 0));
      }
    } finally {
      await insertStmt.finalizeAsync();
    }
  });
}

function mapRowToFoodItem(row: FoodRow): FoodItem {
  return {
    id: row.id,
    name: row.name,
    indonesianName: row.indonesian_name || undefined,
    category: row.category as FoodCategory,
    calories: Number(row.calories),
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fat: Number(row.fat),
    fiber: row.fiber !== null && row.fiber !== undefined ? Number(row.fiber) : undefined,
    defaultServingText: row.default_serving_text,
    defaultServingGrams: Number(row.default_serving_grams),
    isCustom: Boolean(row.is_custom),
  };
}

const COMMON_TYPOS: Record<string, string> = {
  grg: 'goreng',
  bwang: 'bawang',
  bwng: 'bawang',
  ptih: 'putih',
  aym: 'ayam',
  nasgor: 'nasi',
  dinsum: 'dimsum',
  jalankote: 'jalangkote',
  brownis: 'brownies',
  bronis: 'brownies',
};

export async function searchFoodsAsync(
  query: string,
  category: 'All' | FoodCategory = 'All',
  inMemoryCustom: FoodItem[] = []
): Promise<FoodItem[]> {
  const db = await getNutritionDb();
  const trimmed = query.trim().toLowerCase();
  const rawTokens = trimmed ? trimmed.split(/\s+/) : [];
  const tokens = rawTokens.map((tok) => COMMON_TYPOS[tok] || tok);

  const whereClauses: string[] = [];
  const params: (string | number | null)[] = [];

  if (category !== 'All') {
    if (category === 'Custom') {
      whereClauses.push('is_custom = 1');
    } else {
      whereClauses.push('category = ?');
      params.push(category);
    }
  }

  for (const token of tokens) {
    whereClauses.push('(LOWER(name) LIKE ? OR LOWER(COALESCE(indonesian_name, "")) LIKE ?)');
    const wildcard = `%${token}%`;
    params.push(wildcard, wildcard);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const sql = `SELECT * FROM foods ${whereSql} ORDER BY is_custom DESC, name ASC LIMIT 60;`;

  const rows = await db.getAllAsync<FoodRow>(sql, params);
  const results = rows.map(mapRowToFoodItem);

  if (inMemoryCustom.length > 0) {
    const existingIds = new Set(results.map((r) => r.id));
    const matchedCustom = inMemoryCustom.filter((item) => {
      if (existingIds.has(item.id)) return false;
      if (category !== 'All' && category !== 'Custom' && item.category !== category) return false;
      if (tokens.length > 0) {
        const text = `${item.name.toLowerCase()} ${item.indonesianName?.toLowerCase() || ''}`;
        return tokens.every((tok) => text.includes(tok));
      }
      return true;
    });

    return [...matchedCustom, ...results];
  }

  return results;
}

export async function saveCustomFoodToDb(food: FoodItem): Promise<void> {
  const db = await getNutritionDb();
  const stmt = await db.prepareAsync(INSERT_FOOD_NAMED_SQL);
  try {
    await stmt.executeAsync(toFoodInsertParams(food, 1));
  } finally {
    await stmt.finalizeAsync();
  }
}

export async function syncCustomFoodsToDb(customFoods: FoodItem[]): Promise<void> {
  const db = await getNutritionDb();
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM foods WHERE is_custom = 1;');
    if (customFoods.length === 0) return;
    const stmt = await db.prepareAsync(INSERT_FOOD_NAMED_SQL);
    try {
      for (const food of customFoods) {
        await stmt.executeAsync(toFoodInsertParams(food, 1));
      }
    } finally {
      await stmt.finalizeAsync();
    }
  });
}

export function calculateNutrientsForWeight(item: FoodItem, grams: number) {
  const factor = Math.max(0, grams) / 100;
  return {
    calories: Math.round(item.calories * factor),
    protein: Math.round(item.protein * factor * 10) / 10,
    carbs: Math.round(item.carbs * factor * 10) / 10,
    fat: Math.round(item.fat * factor * 10) / 10,
    fiber: item.fiber !== undefined ? Math.round(item.fiber * factor * 10) / 10 : undefined,
  };
}
