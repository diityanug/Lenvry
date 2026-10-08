/**
 * Persistence API — the only place in the app that touches AsyncStorage.
 *
 * Guarantees provided to every caller:
 *  1. **Validated** — values are parsed on the way in and re-validated on the
 *     way out, so a corrupt or outdated row can never reach a screen as-is.
 *  2. **Versioned** — `ensureSchema()` records which shape the stored data was
 *     written in and runs forward migrations when it changes.
 *  3. **Serialised** — writes to the same key are queued, so two screens doing
 *     read-modify-write on the same list can no longer lose an update.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ALL_APP_STORAGE_KEYS, LEGACY_STORAGE_KEYS, STORAGE_KEYS, StorageKeyName } from './keys';
import {
  DATA_KEY_NAMES,
  DEFAULTS,
  decodeRow,
  encodeRow,
  PARSERS,
  SCHEMA_VERSION,
  StorageMap,
} from './schema';

export { STORAGE_KEYS } from './keys';
export { SCHEMA_VERSION } from './schema';
export type { StorageMap, HabitCategoryIconMap, HabitCategoryIconStyle } from './schema';
export type { StorageKeyName } from './keys';

// ---------------------------------------------------------------------------
// Raw (unvalidated) access + write queue
// ---------------------------------------------------------------------------

/** Per-key promise chain: guarantees serialised read-modify-write per row. */
const writeQueues = new Map<string, Promise<unknown>>();

function enqueue<T>(storageKey: string, task: () => Promise<T>): Promise<T> {
  const previous = writeQueues.get(storageKey) ?? Promise.resolve();
  const run = previous.then(task, task);
  // Keep the chain alive even when a task rejects, without swallowing errors
  // for the caller (the rejection is returned through `run`).
  writeQueues.set(
    storageKey,
    run.then(
      () => undefined,
      () => undefined
    )
  );
  return run;
}

/** Decodes a row without waiting for the schema: only used by the schema itself. */
async function readRaw<K extends StorageKeyName>(name: K): Promise<StorageMap[K] | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS[name]);
  if (raw === null) return null;
  return decodeRow(name, raw);
}

const clone = <T,>(value: T): T =>
  value !== null && typeof value === 'object' ? (JSON.parse(JSON.stringify(value)) as T) : value;

// ---------------------------------------------------------------------------
// Schema versioning
// ---------------------------------------------------------------------------

type Migration = () => Promise<void>;

/**
 * Forward migrations, keyed by the version they upgrade *to*.
 *
 * Version 1 introduced this module. Health happens on read: every row is run
 * through its parser whenever it is loaded, and healed values are written back
 * the next time a screen saves. That is deliberate — rewriting the whole
 * database in place at startup would risk destroying fields a parser does not
 * model yet.
 */
const MIGRATIONS: Record<number, Migration> = {};

let schemaPromise: Promise<void> | null = null;

async function stampSchemaVersion(version: number = SCHEMA_VERSION): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.schemaVersion, encodeRow('schemaVersion', version));
}

export async function getSchemaVersion(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.schemaVersion);
    if (raw === null) return 0;
    return decodeRow('schemaVersion', raw);
  } catch {
    return 0;
  }
}

async function runMigrations(): Promise<void> {
  const current = await getSchemaVersion();
  if (current >= SCHEMA_VERSION) return;

  for (let version = current + 1; version <= SCHEMA_VERSION; version += 1) {
    const migration = MIGRATIONS[version];
    if (migration) await migration();
    await stampSchemaVersion(version);
  }
}

/**
 * Prepares storage for use. Safe to call from anywhere, any number of times:
 * the work happens once per app launch and every read/write awaits it.
 */
export function ensureSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = runMigrations().catch((error) => {
      // Never block the UI on a migration failure: reads fall back to
      // per-row validation, which is the actual safety net.
      console.warn('[storage] Schema preparation failed; continuing with validated reads.', error);
    });
  }
  return schemaPromise;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** Reads and validates one row. `null` means "never written on this device". */
export async function readStored<K extends StorageKeyName>(name: K): Promise<StorageMap[K] | null> {
  await ensureSchema();
  try {
    return await readRaw(name);
  } catch (error) {
    console.warn(`[storage] Failed to read "${name}"; falling back to the default.`, error);
    return null;
  }
}

/** Reads one row, substituting the schema default when the row is missing. */
export async function readStoredOr<K extends StorageKeyName>(name: K): Promise<StorageMap[K]> {
  const stored = await readStored(name);
  return stored ?? clone(DEFAULTS[name]);
}

/** Reads several rows in a single round trip. */
export async function readManyStored<K extends StorageKeyName>(
  names: readonly K[]
): Promise<{ [P in K]: StorageMap[P] | null }> {
  await ensureSchema();

  // Built as a loose record and narrowed on return: TypeScript cannot correlate
  // a union key with its value type through `Record<K, StorageMap[K]>`.
  const result: Record<string, unknown> = {};
  const finish = () => result as { [P in K]: StorageMap[P] | null };

  if (names.length === 0) return finish();

  try {
    const pairs = await AsyncStorage.multiGet(names.map((name) => STORAGE_KEYS[name]));
    const rawByKey = new Map(pairs);

    names.forEach((name) => {
      const raw = rawByKey.get(STORAGE_KEYS[name]);
      if (raw === null || raw === undefined) {
        result[name] = null;
        return;
      }
      try {
        result[name] = decodeRow(name, raw);
      } catch (error) {
        console.warn(`[storage] Failed to read "${name}"; treating it as missing.`, error);
        result[name] = null;
      }
    });
  } catch (error) {
    console.warn('[storage] Batch read failed; treating every row as missing.', error);
    names.forEach((name) => {
      result[name] = null;
    });
  }

  return finish();
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/** Validates and persists one row. Resolves with the value actually stored. */
export function writeStored<K extends StorageKeyName>(
  name: K,
  value: StorageMap[K]
): Promise<StorageMap[K]> {
  return enqueue(STORAGE_KEYS[name], async () => {
    await ensureSchema();
    const next = PARSERS[name](value);
    await AsyncStorage.setItem(STORAGE_KEYS[name], encodeRow(name, next));
    return next;
  });
}

/**
 * Serialised read-modify-write. Preferred over `writeStored` for list updates,
 * because the updater always receives the freshest stored value instead of a
 * copy captured in a screen's state.
 */
export function updateStored<K extends StorageKeyName>(
  name: K,
  updater: (current: StorageMap[K]) => StorageMap[K]
): Promise<StorageMap[K]> {
  return enqueue(STORAGE_KEYS[name], async () => {
    await ensureSchema();
    const current = (await readRaw(name)) ?? clone(DEFAULTS[name]);
    const next = PARSERS[name](updater(current));
    await AsyncStorage.setItem(STORAGE_KEYS[name], encodeRow(name, next));
    return next;
  });
}

export function removeStored(name: StorageKeyName): Promise<void> {
  return enqueue(STORAGE_KEYS[name], async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS[name]);
  });
}

// ---------------------------------------------------------------------------
// Backup / restore / reset
// ---------------------------------------------------------------------------

/**
 * Every app-owned row as a plain object, validated and keyed by its raw storage
 * key so that backups stay compatible with files exported by earlier builds.
 */
export async function exportStoredData(): Promise<Record<string, unknown>> {
  await ensureSchema();

  const payload: Record<string, unknown> = {};

  const pairs = await AsyncStorage.multiGet(DATA_KEY_NAMES.map((name) => STORAGE_KEYS[name]));
  const rawByKey = new Map(pairs);

  DATA_KEY_NAMES.forEach((name) => {
    const raw = rawByKey.get(STORAGE_KEYS[name]);
    if (raw === null || raw === undefined) return;
    try {
      payload[STORAGE_KEYS[name]] = decodeRow(name, raw);
    } catch (error) {
      console.warn(`[storage] Skipping "${name}" while exporting.`, error);
    }
  });

  // Legacy-only keys are not part of DATA_KEY_NAMES, so fetch them separately.
  const legacyPairs = await AsyncStorage.multiGet([...LEGACY_STORAGE_KEYS]);
  legacyPairs.forEach(([key, raw]) => {
    if (raw === null) return;
    try {
      payload[key] = JSON.parse(raw);
    } catch {
      payload[key] = raw;
    }
  });

  return payload;
}

/**
 * Restores a backup payload (current or legacy flat format). Values coming from
 * a file are treated as untrusted and run through the schema parsers.
 */
export async function restoreStoredData(payload: Record<string, unknown>): Promise<number> {
  if (!payload || typeof payload !== 'object') return 0;

  const writes: [string, string][] = [];

  DATA_KEY_NAMES.forEach((name) => {
    const key = STORAGE_KEYS[name];
    if (!(key in payload)) return;
    writes.push([key, encodeRow(name, PARSERS[name](payload[key]))]);
  });

  LEGACY_STORAGE_KEYS.forEach((key) => {
    if (!(key in payload)) return;
    const value = payload[key];
    writes.push([key, typeof value === 'string' ? value : JSON.stringify(value)]);
  });

  if (writes.length === 0) return 0;

  await AsyncStorage.multiSet(writes);
  // Whatever the file claimed, the rows above were just re-encoded in the
  // current shape.
  await stampSchemaVersion();
  return writes.length;
}

/** Removes every row this app has ever written. */
export async function clearAllStored(): Promise<void> {
  await AsyncStorage.multiRemove([...ALL_APP_STORAGE_KEYS]);
  await stampSchemaVersion();
}

/** Names of keys that only exist for backward compatibility. */
export const legacyStorageKeys = LEGACY_STORAGE_KEYS;
