import { FoodItem } from '../types/nutrition';
import {
  validateRemoteFoodSeedItems,
  validateRemoteFoodSeedMeta,
} from './foodSeedValidation';

export const DEFAULT_FOOD_SEED_META_URL =
  'https://raw.githubusercontent.com/diityanug/Lenvry/main/assets/data/foods_seed_meta.json';
export const DEFAULT_FOOD_SEED_DATA_URL =
  'https://raw.githubusercontent.com/diityanug/Lenvry/main/assets/data/foods_seed.json';

export const FOOD_SEED_SYNC_COOLDOWN_MS = 12 * 60 * 60 * 1000;
export const FOOD_SEED_FETCH_TIMEOUT_MS = 15_000;

export type FoodSeedSyncStatus =
  | 'updated'
  | 'up_to_date'
  | 'skipped_cooldown'
  | 'offline_or_error';

export interface FoodSeedSyncResult {
  status: FoodSeedSyncStatus;
  previousVersion: number;
  currentVersion: number;
  itemCount: number;
  errorMessage?: string;
}

export interface FoodSeedSyncOptions {
  force?: boolean;
  metaUrl?: string;
  dataUrl?: string;
}

export interface FoodSeedSyncDeps {
  fetchImpl: typeof fetch;
  getSeedInfo: () => Promise<{ version: number; count: number }>;
  applySeed: (items: FoodItem[], version: number) => Promise<number>;
  getLastCheckMs: () => Promise<number | null>;
  setLastCheckMs: (ms: number) => Promise<void>;
  now: () => number;
  metaUrl: string;
  dataUrl: string;
  cooldownMs: number;
  timeoutMs: number;
}

async function fetchJsonWithTimeout(
  fetchImpl: typeof fetch,
  url: string,
  timeoutMs: number
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} while fetching food seed.`);
    }

    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Orchestrate metadata version comparison, remote download, strict schema validation,
 * cooldown handling, and SQLite seed update without throwing uncaught network errors.
 */
export async function syncFoodSeedWithDeps(
  deps: FoodSeedSyncDeps,
  options?: FoodSeedSyncOptions
): Promise<FoodSeedSyncResult> {
  let previousVersion = 0;
  let itemCount = 0;

  try {
    const seedInfo = await deps.getSeedInfo();
    previousVersion = seedInfo.version;
    itemCount = seedInfo.count;

    if (!options?.force) {
      const lastCheckMs = await deps.getLastCheckMs();
      if (lastCheckMs !== null && deps.now() - lastCheckMs < deps.cooldownMs) {
        return {
          status: 'skipped_cooldown',
          previousVersion,
          currentVersion: previousVersion,
          itemCount,
        };
      }
    }

    const metaUrl = options?.metaUrl?.trim() || deps.metaUrl;
    const rawMeta = await fetchJsonWithTimeout(deps.fetchImpl, metaUrl, deps.timeoutMs);
    const meta = validateRemoteFoodSeedMeta(rawMeta);

    if (meta.version <= previousVersion && itemCount > 0) {
      await deps.setLastCheckMs(deps.now());
      return {
        status: 'up_to_date',
        previousVersion,
        currentVersion: previousVersion,
        itemCount,
      };
    }

    const dataUrl = options?.dataUrl?.trim() || meta.dataUrl || deps.dataUrl;
    const rawItems = await fetchJsonWithTimeout(deps.fetchImpl, dataUrl, deps.timeoutMs);
    const validatedItems = validateRemoteFoodSeedItems(rawItems);

    const appliedCount = await deps.applySeed(validatedItems, meta.version);
    await deps.setLastCheckMs(deps.now());

    return {
      status: 'updated',
      previousVersion,
      currentVersion: meta.version,
      itemCount: appliedCount,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to sync food database right now.';
    return {
      status: 'offline_or_error',
      previousVersion,
      currentVersion: previousVersion,
      itemCount,
      errorMessage: message,
    };
  }
}
