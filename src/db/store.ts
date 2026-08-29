import { Platform } from 'react-native';
import { DrinkRecipe, InventoryItem, Prefs } from '../types';
import { SEED_RECIPES } from '../data/recipes';

/**
 * Persistence.
 *
 * Native uses expo-sqlite with real tables, as specced. Web falls back to
 * localStorage — expo-sqlite on web needs a wasm pipeline that buys nothing at
 * this data size, and the web build exists so the app can be checked in a
 * browser, not as the primary target.
 *
 * Both implementations satisfy the same exported functions, so nothing above
 * this file knows which one is running.
 */

const SCHEMA_VERSION = 1;
const isWeb = Platform.OS === 'web';

// ── Native: expo-sqlite ────────────────────────────────────────────────────

let db: any = null;

function sqlite() {
  if (!db) {
    const SQLite = require('expo-sqlite');
    db = SQLite.openDatabaseSync('shaker.db');
    migrate();
  }
  return db;
}

function migrate() {
  const row = db.getFirstSync('PRAGMA user_version') as { user_version: number } | null;
  const current = row?.user_version ?? 0;
  if (current >= SCHEMA_VERSION) return;

  db.execSync(`
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY NOT NULL,
      catalogItemId TEXT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      brand TEXT,
      level TEXT NOT NULL DEFAULT 'full',
      isStaple INTEGER NOT NULL DEFAULT 0,
      icon TEXT NOT NULL DEFAULT '',
      addedAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
    CREATE INDEX IF NOT EXISTS idx_inventory_catalog ON inventory(catalogItemId);

    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      origin TEXT NOT NULL,
      method TEXT NOT NULL,
      glass TEXT,
      ingredients TEXT NOT NULL,
      steps TEXT NOT NULL,
      garnish TEXT,
      vibeTags TEXT NOT NULL,
      accent TEXT NOT NULL,
      isZeroProof INTEGER NOT NULL DEFAULT 0,
      timesMade INTEGER NOT NULL DEFAULT 0,
      lastMadeAt INTEGER,
      isFavorite INTEGER NOT NULL DEFAULT 0,
      sourceUrl TEXT,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prefs (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
  db.execSync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

// ── Web: localStorage ──────────────────────────────────────────────────────

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = globalThis.localStorage?.getItem('shaker:' + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown) {
  try {
    globalThis.localStorage?.setItem('shaker:' + key, JSON.stringify(value));
  } catch {
    /* private mode, quota — the app still works, it just forgets */
  }
}

// ── Row mapping ────────────────────────────────────────────────────────────

function rowToRecipe(r: any): DrinkRecipe {
  return {
    ...r,
    ingredients: JSON.parse(r.ingredients),
    steps: JSON.parse(r.steps),
    vibeTags: JSON.parse(r.vibeTags),
    isZeroProof: !!r.isZeroProof,
    isFavorite: !!r.isFavorite,
  };
}

function rowToItem(r: any): InventoryItem {
  return { ...r, isStaple: !!r.isStaple };
}

// ── Inventory ──────────────────────────────────────────────────────────────

export function loadKit(): InventoryItem[] {
  if (isWeb) return lsGet<InventoryItem[]>('kit', []);
  return sqlite()
    .getAllSync('SELECT * FROM inventory ORDER BY addedAt DESC')
    .map(rowToItem);
}

export function saveKitItem(item: InventoryItem) {
  if (isWeb) {
    const kit = lsGet<InventoryItem[]>('kit', []);
    const i = kit.findIndex((k) => k.id === item.id);
    if (i >= 0) kit[i] = item;
    else kit.unshift(item);
    lsSet('kit', kit);
    return;
  }
  sqlite().runSync(
    `INSERT INTO inventory
       (id, catalogItemId, name, category, brand, level, isStaple, icon, addedAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, category=excluded.category, brand=excluded.brand,
       level=excluded.level, isStaple=excluded.isStaple, icon=excluded.icon,
       updatedAt=excluded.updatedAt`,
    [
      item.id,
      item.catalogItemId,
      item.name,
      item.category,
      item.brand,
      item.level,
      item.isStaple ? 1 : 0,
      item.icon,
      item.addedAt,
      item.updatedAt,
    ]
  );
}

export function deleteKitItem(id: string) {
  if (isWeb) {
    lsSet('kit', lsGet<InventoryItem[]>('kit', []).filter((k) => k.id !== id));
    return;
  }
  sqlite().runSync('DELETE FROM inventory WHERE id = ?', [id]);
}

// ── Recipes ────────────────────────────────────────────────────────────────

/**
 * Loads recipes, adding any seed recipes the store has not seen before.
 *
 * Merging by id rather than seeding once means a library added in a later
 * release actually reaches people who already opened the app — while edits to
 * an existing recipe, seed or not, are never overwritten.
 */
export function loadRecipes(): DrinkRecipe[] {
  if (isWeb) {
    const stored = lsGet<DrinkRecipe[]>('recipes', []);
    const known = new Set(stored.map((r) => r.id));
    const missing = SEED_RECIPES.filter((r) => !known.has(r.id));
    if (missing.length === 0) return stored;
    const merged = [...missing, ...stored];
    lsSet('recipes', merged);
    return merged;
  }

  const db = sqlite();
  const existing = db.getAllSync('SELECT id FROM recipes') as { id: string }[];
  const known = new Set(existing.map((r) => r.id));
  for (const r of SEED_RECIPES) {
    if (!known.has(r.id)) insertRecipe(r);
  }
  return db.getAllSync('SELECT * FROM recipes ORDER BY createdAt DESC').map(rowToRecipe);
}

function insertRecipe(r: DrinkRecipe) {
  sqlite().runSync(
    `INSERT INTO recipes
       (id, name, origin, method, glass, ingredients, steps, garnish, vibeTags,
        accent, isZeroProof, timesMade, lastMadeAt, isFavorite, sourceUrl, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, method=excluded.method, glass=excluded.glass,
       ingredients=excluded.ingredients, steps=excluded.steps,
       garnish=excluded.garnish, vibeTags=excluded.vibeTags, accent=excluded.accent,
       isZeroProof=excluded.isZeroProof, timesMade=excluded.timesMade,
       lastMadeAt=excluded.lastMadeAt, isFavorite=excluded.isFavorite`,
    [
      r.id,
      r.name,
      r.origin,
      r.method,
      r.glass,
      JSON.stringify(r.ingredients),
      JSON.stringify(r.steps),
      r.garnish,
      JSON.stringify(r.vibeTags),
      r.accent,
      r.isZeroProof ? 1 : 0,
      r.timesMade,
      r.lastMadeAt,
      r.isFavorite ? 1 : 0,
      r.sourceUrl,
      r.createdAt,
    ]
  );
}

export function saveRecipe(recipe: DrinkRecipe) {
  if (isWeb) {
    const all = lsGet<DrinkRecipe[]>('recipes', []);
    const i = all.findIndex((r) => r.id === recipe.id);
    if (i >= 0) all[i] = recipe;
    else all.unshift(recipe);
    lsSet('recipes', all);
    return;
  }
  insertRecipe(recipe);
}

export function deleteRecipe(id: string) {
  if (isWeb) {
    lsSet('recipes', lsGet<DrinkRecipe[]>('recipes', []).filter((r) => r.id !== id));
    return;
  }
  sqlite().runSync('DELETE FROM recipes WHERE id = ?', [id]);
}

// ── Prefs ──────────────────────────────────────────────────────────────────

const DEFAULT_PREFS: Prefs = {
  ageGateAcceptedAt: null,
  zeroProofMode: false,
  allowSubstitutes: true,
};

export function loadPrefs(): Prefs {
  if (isWeb) return { ...DEFAULT_PREFS, ...lsGet<Partial<Prefs>>('prefs', {}) };
  const rows = sqlite().getAllSync('SELECT * FROM prefs') as { key: string; value: string }[];
  const out: any = { ...DEFAULT_PREFS };
  for (const row of rows) {
    try {
      out[row.key] = JSON.parse(row.value);
    } catch {
      /* ignore a corrupt pref rather than failing to boot */
    }
  }
  return out as Prefs;
}

export function savePrefs(prefs: Prefs) {
  if (isWeb) {
    lsSet('prefs', prefs);
    return;
  }
  const db = sqlite();
  for (const [key, value] of Object.entries(prefs)) {
    db.runSync(
      'INSERT INTO prefs (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
      [key, JSON.stringify(value)]
    );
  }
}
