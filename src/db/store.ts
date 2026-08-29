import * as SQLite from 'expo-sqlite';
import { DrinkRecipe, InventoryItem, Prefs } from '../types';
import { SEED_RECIPES } from '../data/recipes';

/**
 * Persistence — native.
 *
 * Metro resolves `store.web.ts` instead of this file on web, which is what
 * keeps expo-sqlite's native module out of the web bundle entirely. Both files
 * export the same functions, so nothing above this layer knows the difference.
 */

const SCHEMA_VERSION = 1;

let db: SQLite.SQLiteDatabase | null = null;

function sqlite(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('shaker.db');
    migrate(db);
  }
  return db;
}

function migrate(handle: SQLite.SQLiteDatabase) {
  const row = handle.getFirstSync('PRAGMA user_version') as { user_version: number } | null;
  if ((row?.user_version ?? 0) >= SCHEMA_VERSION) return;

  handle.execSync(`
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
  handle.execSync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

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

// ── Inventory ──────────────────────────────────────────────────────────────

export function loadKit(): InventoryItem[] {
  const rows = sqlite().getAllSync('SELECT * FROM inventory ORDER BY addedAt DESC') as any[];
  return rows.map((r) => ({ ...r, isStaple: !!r.isStaple }));
}

export function saveKitItem(item: InventoryItem) {
  sqlite().runSync(
    `INSERT INTO inventory
       (id, catalogItemId, name, category, brand, level, isStaple, icon, addedAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, category=excluded.category, brand=excluded.brand,
       level=excluded.level, isStaple=excluded.isStaple, icon=excluded.icon,
       updatedAt=excluded.updatedAt`,
    [
      item.id, item.catalogItemId, item.name, item.category, item.brand,
      item.level, item.isStaple ? 1 : 0, item.icon, item.addedAt, item.updatedAt,
    ]
  );
}

export function deleteKitItem(id: string) {
  sqlite().runSync('DELETE FROM inventory WHERE id = ?', [id]);
}

// ── Recipes ────────────────────────────────────────────────────────────────

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
      r.id, r.name, r.origin, r.method, r.glass,
      JSON.stringify(r.ingredients), JSON.stringify(r.steps), r.garnish,
      JSON.stringify(r.vibeTags), r.accent, r.isZeroProof ? 1 : 0,
      r.timesMade, r.lastMadeAt, r.isFavorite ? 1 : 0, r.sourceUrl, r.createdAt,
    ]
  );
}

/**
 * Adds any seed recipes the database has not seen before. Merging by id means
 * a library added in a later release reaches people who already opened the
 * app, while edits to an existing recipe are never overwritten.
 */
export function loadRecipes(): DrinkRecipe[] {
  const handle = sqlite();
  const existing = handle.getAllSync('SELECT id FROM recipes') as { id: string }[];
  const known = new Set(existing.map((r) => r.id));
  for (const r of SEED_RECIPES) {
    if (!known.has(r.id)) insertRecipe(r);
  }
  const rows = handle.getAllSync('SELECT * FROM recipes ORDER BY createdAt DESC') as any[];
  return rows.map(rowToRecipe);
}

export function saveRecipe(recipe: DrinkRecipe) {
  insertRecipe(recipe);
}

export function deleteRecipe(id: string) {
  sqlite().runSync('DELETE FROM recipes WHERE id = ?', [id]);
}

// ── Prefs ──────────────────────────────────────────────────────────────────

export const DEFAULT_PREFS: Prefs = {
  ageGateAcceptedAt: null,
  zeroProofMode: false,
  allowSubstitutes: true,
};

export function loadPrefs(): Prefs {
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
  const handle = sqlite();
  for (const [key, value] of Object.entries(prefs)) {
    handle.runSync(
      'INSERT INTO prefs (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
      [key, JSON.stringify(value)]
    );
  }
}
