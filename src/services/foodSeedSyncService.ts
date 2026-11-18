import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_FOOD_SEED_DATA_URL,
  DEFAULT_FOOD_SEED_META_URL,
  FOOD_SEED_FETCH_TIMEOUT_MS,
  FOOD_SEED_SYNC_COOLDOWN_MS,
  FoodSeedSyncDeps,
  FoodSeedSyncOptions,
  FoodSeedSyncResult,
  FoodSeedSyncStatus,
  syncFoodSeedWithDeps,
} from '../utils/foodSeedSyncEngine';
import {
  FoodSeedMeta,
  FoodSeedMetaSchema,
  RemoteFoodItemSchema,
  validateRemoteFoodSeedItems,
  validateRemoteFoodSeedMeta,
} from '../utils/foodSeedValidation';
import { applyRemoteFoodSeed, getMasterFoodSeedInfo } from './nutritionDatabaseService';

export {
  DEFAULT_FOOD_SEED_DATA_URL,
  DEFAULT_FOOD_SEED_META_URL,
  FOOD_SEED_FETCH_TIMEOUT_MS,
  FOOD_SEED_SYNC_COOLDOWN_MS,
  FoodSeedMetaSchema,
  RemoteFoodItemSchema,
  syncFoodSeedWithDeps,
  validateRemoteFoodSeedItems,
  validateRemoteFoodSeedMeta,
};
export type {
  FoodSeedMeta,
  FoodSeedSyncDeps,
  FoodSeedSyncOptions,
  FoodSeedSyncResult,
  FoodSeedSyncStatus,
};

const LAST_CHECK_STORAGE_KEY = '@lenvry_food_seed_last_check';

let activeSyncPromise: Promise<FoodSeedSyncResult> | null = null;

function resolveConfiguredUrl(envValue: string | undefined, fallback: string): string {
  const trimmed = envValue?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function getDefaultDeps(): FoodSeedSyncDeps {
  return {
    fetchImpl: fetch,
    getSeedInfo: getMasterFoodSeedInfo,
    applySeed: applyRemoteFoodSeed,
    getLastCheckMs: async () => {
      const raw = await AsyncStorage.getItem(LAST_CHECK_STORAGE_KEY);
      if (!raw) return null;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : null;
    },
    setLastCheckMs: async (ms: number) => {
      await AsyncStorage.setItem(LAST_CHECK_STORAGE_KEY, String(ms));
    },
    now: () => Date.now(),
    metaUrl: resolveConfiguredUrl(
      process.env.EXPO_PUBLIC_FOOD_SEED_META_URL,
      DEFAULT_FOOD_SEED_META_URL
    ),
    dataUrl: resolveConfiguredUrl(
      process.env.EXPO_PUBLIC_FOOD_SEED_DATA_URL,
      DEFAULT_FOOD_SEED_DATA_URL
    ),
    cooldownMs: FOOD_SEED_SYNC_COOLDOWN_MS,
    timeoutMs: FOOD_SEED_FETCH_TIMEOUT_MS,
  };
}

/**
 * Check remote manifest for food seed updates and sync SQLite in background.
 * Safe offline fallback: never throws uncaught errors and coalesces concurrent calls.
 */
export async function syncFoodSeedIfNeeded(
  options?: FoodSeedSyncOptions
): Promise<FoodSeedSyncResult> {
  if (activeSyncPromise) {
    const inFlightResult = await activeSyncPromise;
    if (!options?.force || inFlightResult.status !== 'skipped_cooldown') {
      return inFlightResult;
    }
  }

  const run = syncFoodSeedWithDeps(getDefaultDeps(), options).finally(() => {
    if (activeSyncPromise === run) {
      activeSyncPromise = null;
    }
  });

  activeSyncPromise = run;
  return run;
}
