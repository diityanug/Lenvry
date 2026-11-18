import fs from 'node:fs';
import path from 'node:path';
import {
  validateRemoteFoodSeedItems,
  validateRemoteFoodSeedMeta,
} from '../src/utils/foodSeedValidation.ts';

const dataDir = path.resolve(process.cwd(), 'assets', 'data');
const seedPath = path.join(dataDir, 'foods_seed.json');
const metaPath = path.join(dataDir, 'foods_seed_meta.json');

const checkOnly = process.argv.includes('--check');

const rawItems = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
const validatedItems = validateRemoteFoodSeedItems(rawItems);

if (Array.isArray(rawItems) && validatedItems.length !== rawItems.length) {
  const seen = new Set();
  const duplicates = [];
  for (const entry of rawItems) {
    if (entry?.id) {
      if (seen.has(entry.id)) duplicates.push(entry.id);
      seen.add(entry.id);
    }
  }
  throw new Error(`Duplicate food IDs detected in foods_seed.json: ${duplicates.join(', ')}`);
}

const rawMeta = fs.existsSync(metaPath)
  ? JSON.parse(fs.readFileSync(metaPath, 'utf8'))
  : { version: 1 };
const currentMeta = validateRemoteFoodSeedMeta(rawMeta);

if (checkOnly) {
  console.log(
    `foods_seed.json valid (${validatedItems.length} items, meta v${currentMeta.version}).`
  );
  process.exit(0);
}

const nextMeta = {
  ...currentMeta,
  version: currentMeta.version + 1,
  count: validatedItems.length,
  updatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
};

fs.writeFileSync(metaPath, `${JSON.stringify(nextMeta, null, 2)}\n`, 'utf8');
console.log(
  `Updated ${path.relative(process.cwd(), metaPath)} -> v${nextMeta.version} (${nextMeta.count} items).`
);
