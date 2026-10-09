import * as SQLite from 'expo-sqlite';
import { FoodItem, FoodCategory } from '../types/nutrition';
import foodsSeedData from '../../assets/data/foods_seed.json';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getNutritionDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = await SQLite.openDatabaseAsync('lenvry.db');
    await db.execAsync('PRAGMA journal_mode = WAL;');

    // Create foods table
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

    // Check if initial seeding or update is needed (e.g. Imperial Kitchen menu update)
    const countResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM foods WHERE is_custom = 0;'
    );
    const garlicChickenCheck = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM foods WHERE id = 'brand_imperial_kitchen_ayam_goreng_bawang_putih';"
    );

    if (
      !countResult ||
      countResult.count === 0 ||
      !garlicChickenCheck ||
      garlicChickenCheck.count === 0
    ) {
      await seedMasterFoods(db);
    }

    dbInstance = db;
    return db;
  })();

  return initPromise;
}

async function seedMasterFoods(db: SQLite.SQLiteDatabase) {
  const masterItems = foodsSeedData as FoodItem[];

  await db.withTransactionAsync(async () => {
    const insertStmt = await db.prepareAsync(`
      INSERT OR REPLACE INTO foods (
        id, name, indonesian_name, category, calories, protein, carbs, fat, fiber,
        default_serving_text, default_serving_grams, is_custom
      ) VALUES ($id, $name, $indonesianName, $category, $calories, $protein, $carbs, $fat, $fiber, $defaultServingText, $defaultServingGrams, 0);
    `);

    try {
      for (const item of masterItems) {
        await insertStmt.executeAsync({
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
        });
      }
    } finally {
      await insertStmt.finalizeAsync();
    }
  });
}

function mapRowToFoodItem(row: any): FoodItem {
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
  const params: any[] = [];

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
    params.push(wildwildcard(wildcard), wildwildcard(wildcard));
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const sql = `SELECT * FROM foods ${whereSql} ORDER BY is_custom DESC, name ASC LIMIT 60;`;

  const rows = await db.getAllAsync<any>(sql, params);
  const results = rows.map(mapRowToFoodItem);

  // If there are in-memory custom items not yet in SQLite, ensure they are merged
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

function wildwildcard(w: string) {
  return w;
}

export async function saveCustomFoodToDb(food: FoodItem): Promise<void> {
  const db = await getNutritionDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO foods (
      id, name, indonesian_name, category, calories, protein, carbs, fat, fiber,
      default_serving_text, default_serving_grams, is_custom
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1);`,
    [
      food.id,
      food.name,
      food.indonesianName || null,
      food.category,
      food.calories,
      food.protein,
      food.carbs,
      food.fat,
      food.fiber !== undefined ? food.fiber : null,
      food.defaultServingText,
      food.defaultServingGrams,
    ]
  );
}

export async function deleteCustomFoodFromDb(id: string): Promise<void> {
  const db = await getNutritionDb();
  await db.runAsync('DELETE FROM foods WHERE id = ? AND is_custom = 1;', [id]);
}

export async function getAllCustomFoodsFromDb(): Promise<FoodItem[]> {
  const db = await getNutritionDb();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM foods WHERE is_custom = 1 ORDER BY name ASC;'
  );
  return rows.map(mapRowToFoodItem);
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
