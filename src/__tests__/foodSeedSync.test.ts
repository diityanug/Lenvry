import { describe, expect, it } from 'bun:test';
import bundledMeta from '../../assets/data/foods_seed_meta.json';
import bundledFoods from '../../assets/data/foods_seed.json';
import { FoodItem } from '../types/nutrition';
import {
  DEFAULT_FOOD_SEED_DATA_URL,
  DEFAULT_FOOD_SEED_META_URL,
  FOOD_SEED_SYNC_COOLDOWN_MS,
  FoodSeedSyncDeps,
  syncFoodSeedWithDeps,
} from '../utils/foodSeedSyncEngine';
import {
  shouldSeedBundledFoods,
  validateRemoteFoodSeedItems,
  validateRemoteFoodSeedMeta,
} from '../utils/foodSeedValidation';

const SAMPLE_FOOD: FoodItem = {
  id: 'food_remote_tempe_bacem',
  name: 'Tempe Bacem',
  indonesianName: 'Tempe Bacem',
  category: 'Proteins',
  calories: 210,
  protein: 14,
  carbs: 18,
  fat: 9,
  fiber: 3,
  defaultServingText: '1 piece (60g)',
  defaultServingGrams: 60,
  isCustom: false,
};

function createMockFetch(
  routes: Record<string, { status?: number; body?: unknown; throwError?: Error }>
): { fetchImpl: typeof fetch; calledUrls: string[] } {
  const calledUrls: string[] = [];

  const fetchImpl = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calledUrls.push(url);
    const handler = routes[url];
    if (!handler) {
      return new Response(null, { status: 404 });
    }
    if (handler.throwError) {
      throw handler.throwError;
    }
    const status = handler.status ?? 200;
    return new Response(JSON.stringify(handler.body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as unknown as typeof fetch;

  return { fetchImpl, calledUrls };
}

function expectThrows(fn: () => unknown): Error {
  let caught: unknown;
  try {
    fn();
  } catch (err) {
    caught = err;
  }
  expect(caught instanceof Error).toBe(true);
  return caught as Error;
}

describe('foodSeedValidation & version guards', () => {
  it('validates the checked-in foods_seed.json and foods_seed_meta.json assets cleanly', () => {
    const meta = validateRemoteFoodSeedMeta(bundledMeta);
    const items = validateRemoteFoodSeedItems(bundledFoods);
    expect(meta.version >= 8).toBe(true);
    expect(meta.count).toBe(items.length);
    expect(items.length >= 2302).toBe(true);
  });

  it('preserves newer remote OTA seeds unless master table is empty or APK bundle upgrades', () => {
    expect(shouldSeedBundledFoods(0, 0, 2064, 7)).toBe(true);
    expect(shouldSeedBundledFoods(7, 2064, 2064, 7)).toBe(false);
    expect(shouldSeedBundledFoods(7, 1900, 2064, 7)).toBe(true);
    expect(shouldSeedBundledFoods(8, 2100, 2064, 7)).toBe(false);
    expect(shouldSeedBundledFoods(8, 0, 2064, 7)).toBe(true);
    expect(shouldSeedBundledFoods(8, 2100, 2300, 10)).toBe(true);
  });

  it('rejects insecure HTTP dataUrl overrides and malformed food payloads', () => {
    expectThrows(() =>
      validateRemoteFoodSeedMeta({ version: 8, dataUrl: 'http://example.com/foods.json' })
    );
    expectThrows(() => validateRemoteFoodSeedItems([]));
    expectThrows(() => validateRemoteFoodSeedItems([{}]));
    expectThrows(() =>
      validateRemoteFoodSeedItems([{ ...SAMPLE_FOOD, calories: -10 }])
    );
  });

  it('normalizes empty indonesianName and deduplicates items by ID', () => {
    const items = validateRemoteFoodSeedItems([
      { ...SAMPLE_FOOD, indonesianName: '   ' },
      { ...SAMPLE_FOOD, calories: 225, indonesianName: 'Tempe Bacem Manis' },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].calories).toBe(225);
    expect(items[0].isCustom).toBe(false);
  });
});

describe('syncFoodSeedWithDeps', () => {
  function createHarness(overrides?: Partial<FoodSeedSyncDeps>) {
    let dbVersion = 7;
    let dbItemsCount = 2064;
    let lastCheckMs: number | null = null;
    let appliedBatches: { version: number; items: FoodItem[] }[] = [];

    const { fetchImpl, calledUrls } = createMockFetch({
      [DEFAULT_FOOD_SEED_META_URL]: {
        body: { version: 8, count: 1 },
      },
      [DEFAULT_FOOD_SEED_DATA_URL]: {
        body: [SAMPLE_FOOD],
      },
    });

    const deps: FoodSeedSyncDeps = {
      fetchImpl,
      getSeedInfo: async () => ({ version: dbVersion, count: dbItemsCount }),
      applySeed: async (items, version) => {
        appliedBatches.push({ items, version });
        dbVersion = version;
        dbItemsCount = items.length;
        return items.length;
      },
      getLastCheckMs: async () => lastCheckMs,
      setLastCheckMs: async (ms) => {
        lastCheckMs = ms;
      },
      now: () => 1_700_000_000_000,
      metaUrl: DEFAULT_FOOD_SEED_META_URL,
      dataUrl: DEFAULT_FOOD_SEED_DATA_URL,
      cooldownMs: FOOD_SEED_SYNC_COOLDOWN_MS,
      timeoutMs: 5_000,
      ...overrides,
    };

    return {
      deps,
      calledUrls,
      getState: () => ({ dbVersion, dbItemsCount, lastCheckMs, appliedBatches }),
    };
  }

  it('downloads and applies newer seed version while recording lastCheckMs', async () => {
    const h = createHarness();
    const res = await syncFoodSeedWithDeps(h.deps);

    expect(res.status).toBe('updated');
    expect(res.previousVersion).toBe(7);
    expect(res.currentVersion).toBe(8);
    expect(res.itemCount).toBe(1);
    expect(h.getState().dbVersion).toBe(8);
    expect(h.getState().appliedBatches).toHaveLength(1);
    expect(h.getState().lastCheckMs).toBe(1_700_000_000_000);
    expect(h.calledUrls).toEqual([DEFAULT_FOOD_SEED_META_URL, DEFAULT_FOOD_SEED_DATA_URL]);
  });

  it('supports manifest HTTPS dataUrl override without app rebuild', async () => {
    const mirrorUrl = 'https://cdn.example.com/lenvry/foods_v9.json';
    const { fetchImpl, calledUrls } = createMockFetch({
      [DEFAULT_FOOD_SEED_META_URL]: { body: { version: 9, dataUrl: mirrorUrl } },
      [mirrorUrl]: { body: [SAMPLE_FOOD] },
    });

    const h = createHarness({ fetchImpl });
    const res = await syncFoodSeedWithDeps(h.deps);

    expect(res.status).toBe('updated');
    expect(res.currentVersion).toBe(9);
    expect(calledUrls).toEqual([DEFAULT_FOOD_SEED_META_URL, mirrorUrl]);
  });

  it('skips downloading full food JSON when local DB version matches remote meta', async () => {
    const { fetchImpl, calledUrls } = createMockFetch({
      [DEFAULT_FOOD_SEED_META_URL]: { body: { version: 7, count: 2064 } },
    });

    const h = createHarness({ fetchImpl });
    const res = await syncFoodSeedWithDeps(h.deps);

    expect(res.status).toBe('up_to_date');
    expect(res.currentVersion).toBe(7);
    expect(calledUrls).toEqual([DEFAULT_FOOD_SEED_META_URL]);
    expect(h.getState().appliedBatches).toHaveLength(0);
    expect(h.getState().lastCheckMs).toBe(1_700_000_000_000);
  });

  it('respects cooldown unless force: true is provided', async () => {
    const h = createHarness({
      getLastCheckMs: async () => 1_700_000_000_000 - 60_000,
    });

    const skipped = await syncFoodSeedWithDeps(h.deps);
    expect(skipped.status).toBe('skipped_cooldown');
    expect(h.calledUrls).toHaveLength(0);

    const forced = await syncFoodSeedWithDeps(h.deps, { force: true });
    expect(forced.status).toBe('updated');
    expect(h.calledUrls).toHaveLength(2);
  });

  it('does not overwrite SQLite or lock cooldown when offline or payload is invalid', async () => {
    const offlineMock = createMockFetch({
      [DEFAULT_FOOD_SEED_META_URL]: { throwError: new Error('Network request failed') },
    });
    const h1 = createHarness({ fetchImpl: offlineMock.fetchImpl });
    const res1 = await syncFoodSeedWithDeps(h1.deps);

    expect(res1.status).toBe('offline_or_error');
    expect(res1.errorMessage).toContain('Network request failed');
    expect(h1.getState().dbVersion).toBe(7);
    expect(h1.getState().lastCheckMs).toBeNull();

    const badPayloadMock = createMockFetch({
      [DEFAULT_FOOD_SEED_META_URL]: { body: { version: 8 } },
      [DEFAULT_FOOD_SEED_DATA_URL]: { body: [] },
    });
    const h2 = createHarness({ fetchImpl: badPayloadMock.fetchImpl });
    const res2 = await syncFoodSeedWithDeps(h2.deps);

    expect(res2.status).toBe('offline_or_error');
    expect(h2.getState().dbVersion).toBe(7);
    expect(h2.getState().appliedBatches).toHaveLength(0);
    expect(h2.getState().lastCheckMs).toBeNull();

    const httpErrorMock = createMockFetch({
      [DEFAULT_FOOD_SEED_META_URL]: { status: 500, body: { error: 'Server error' } },
    });
    const h3 = createHarness({ fetchImpl: httpErrorMock.fetchImpl });
    const res3 = await syncFoodSeedWithDeps(h3.deps);

    expect(res3.status).toBe('offline_or_error');
    expect(res3.errorMessage).toContain('HTTP 500');
    expect(h3.getState().dbVersion).toBe(7);
    expect(h3.getState().lastCheckMs).toBeNull();
  });
});
