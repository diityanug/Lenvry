import { z } from 'zod';
import { FoodItem } from '../types/nutrition';

export const FoodSeedMetaSchema = z.object({
  version: z.number().int().positive(),
  count: z.number().int().nonnegative().optional(),
  updatedAt: z.string().optional(),
  dataUrl: z
    .string()
    .url()
    .refine((value) => value.startsWith('https://'), {
      message: 'Remote food seed URL must use HTTPS',
    })
    .optional(),
});

export type FoodSeedMeta = z.infer<typeof FoodSeedMetaSchema>;

export const RemoteFoodItemSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  indonesianName: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  category: z.enum([
    'Staples',
    'Proteins',
    'Vegetables',
    'Fruits',
    'Dairy & Drinks',
    'Snacks',
    'Custom',
  ]),
  calories: z.number().finite().min(0),
  protein: z.number().finite().min(0),
  carbs: z.number().finite().min(0),
  fat: z.number().finite().min(0),
  fiber: z.number().finite().min(0).optional(),
  defaultServingText: z.string().trim().min(1),
  defaultServingGrams: z.number().finite().positive(),
});

export function validateRemoteFoodSeedMeta(raw: unknown): FoodSeedMeta {
  const parsed = FoodSeedMetaSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error('Invalid remote food seed manifest format.');
  }
  return parsed.data;
}

/**
 * Validate and normalize a downloaded food seed JSON array before replacing SQLite rows.
 * Rejects empty or malformed payloads and deduplicates by food ID.
 */
export function validateRemoteFoodSeedItems(raw: unknown): FoodItem[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error('Remote food seed payload must be a non-empty array.');
  }

  const deduped = new Map<string, FoodItem>();
  for (let i = 0; i < raw.length; i += 1) {
    const parsed = RemoteFoodItemSchema.safeParse(raw[i]);
    if (!parsed.success) {
      const candidate = raw[i] as { id?: unknown } | null | undefined;
      const itemId = typeof candidate?.id === 'string' ? candidate.id : `#${i}`;
      throw new Error(`Invalid food item in remote seed (${itemId}).`);
    }

    const item = parsed.data;
    deduped.set(item.id, {
      id: item.id,
      name: item.name,
      indonesianName: item.indonesianName,
      category: item.category,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      fiber: item.fiber,
      defaultServingText: item.defaultServingText,
      defaultServingGrams: item.defaultServingGrams,
      isCustom: false,
    });
  }

  return Array.from(deduped.values());
}

/**
 * Determine whether SQLite needs seeding from bundled foods_seed.json.
 * Preserves newer remote OTA seeds unless master rows are missing.
 */
export function shouldSeedBundledFoods(
  currentDbVersion: number,
  masterCount: number,
  bundledCount: number,
  bundledVersion: number
): boolean {
  if (currentDbVersion < bundledVersion || masterCount <= 0) {
    return true;
  }
  return currentDbVersion === bundledVersion && masterCount !== bundledCount;
}
