import * as SQLite from 'expo-sqlite';
import { DrinkRecipe, InventoryItem, PartyPlan, Prefs, ProfileData, ProfileIndex, ShoppingItem } from '../types';
import { newLocalProfile, profileIdIsValid, readProfileIndex, renameLocalProfile } from '../logic/localProfiles';
import { bindProfileStore } from './profileStore';
import { reportPersistenceError } from '../persistenceStatus';
import { normalizeParty } from '../logic/hosting';
import { SEED_RECIPES } from '../data/recipes';

/**
 * Persistence — native.
 *
 * Metro resolves `store.web.ts` instead of this file on web, which is what
 * keeps expo-sqlite's native module out of the web bundle entirely. Both files
 * export the same functions, so nothing above this layer knows the difference.
 */

const SCHEMA_VERSION = 5;

const databases = new Map<string, SQLite.SQLiteDatabase>();

function sqlite(profileId = 'default'): SQLite.SQLiteDatabase {
  if (!profileIdIsValid(profileId)) throw new Error('Invalid local bar identifier.');
  const existing = databases.get(profileId);
  if (existing) return existing;
  // SQLite is a private file on this phone. The original bar keeps shaker.db;
  // every additional bar gets its own file in the app's documents directory.
  const name = profileId === 'default' ? 'shaker.db' : `shaker-${profileId}.db`;
  try {
    const handle = SQLite.openDatabaseSync(name);
    migrate(handle);
    databases.set(profileId, handle);
    return handle;
  } catch (error) { reportPersistenceError('read'); throw error; }
}

/**
 * Stepwise migrations. Each step runs only if the database is below it, so a
 * fresh install and an install from an earlier release converge on the same
 * schema without either being special-cased.
 */
function migrate(handle: SQLite.SQLiteDatabase) {
  const row = handle.getFirstSync('PRAGMA user_version') as { user_version: number } | null;
  const from = row?.user_version ?? 0;
  if (from >= SCHEMA_VERSION) return;

  if (from < 1) {
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
  }

  if (from < 2) {
    // Book attribution and themed collections. ALTER is wrapped because a
    // fresh v1 table created above already lacks them, but a database that
    // somehow has them must not abort the whole migration.
    for (const col of ['sourceNote TEXT', 'theme TEXT']) {
      try {
        handle.execSync(`ALTER TABLE recipes ADD COLUMN ${col}`);
      } catch {
        /* column already present */
      }
    }
    handle.execSync('CREATE INDEX IF NOT EXISTS idx_recipes_theme ON recipes(theme)');
  }

  if (from < 3) {
    try {
      handle.execSync('ALTER TABLE recipes ADD COLUMN rating INTEGER');
    } catch {
      /* column already present */
    }
  }

  if (from < 4) {
    handle.execSync(`
      CREATE TABLE IF NOT EXISTS shopping (
        id TEXT PRIMARY KEY NOT NULL,
        catalogItemId TEXT,
        name TEXT NOT NULL,
        done INTEGER NOT NULL DEFAULT 0,
        addedAt INTEGER NOT NULL
      );
    `);
  }

  if (from < 5) handle.execSync('CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)');
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
    rating: r.rating ?? null,
    sourceNote: r.sourceNote ?? null,
    theme: r.theme ?? null,
  };
}

// ── Inventory ──────────────────────────────────────────────────────────────

export function loadKit(profileId = 'default'): InventoryItem[] {
  const rows = sqlite(profileId).getAllSync('SELECT * FROM inventory ORDER BY addedAt DESC') as any[];
  return rows.map((r) => ({ ...r, isStaple: !!r.isStaple }));
}

export function saveKitItem(item: InventoryItem, profileId = 'default') {
  sqlite(profileId).runSync(
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

export function deleteKitItem(id: string, profileId = 'default') {
  sqlite(profileId).runSync('DELETE FROM inventory WHERE id = ?', [id]);
}

// ── Recipes ────────────────────────────────────────────────────────────────

function insertRecipe(r: DrinkRecipe, profileId = 'default') {
  sqlite(profileId).runSync(
    `INSERT INTO recipes
       (id, name, origin, method, glass, ingredients, steps, garnish, vibeTags,
        accent, isZeroProof, timesMade, lastMadeAt, isFavorite, rating, sourceUrl,
        sourceNote, theme, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, method=excluded.method, glass=excluded.glass,
       ingredients=excluded.ingredients, steps=excluded.steps,
       garnish=excluded.garnish, vibeTags=excluded.vibeTags, accent=excluded.accent,
       isZeroProof=excluded.isZeroProof, timesMade=excluded.timesMade,
       lastMadeAt=excluded.lastMadeAt, isFavorite=excluded.isFavorite,
       rating=excluded.rating, sourceNote=excluded.sourceNote, theme=excluded.theme`,
    [
      r.id, r.name, r.origin, r.method, r.glass,
      JSON.stringify(r.ingredients), JSON.stringify(r.steps), r.garnish,
      JSON.stringify(r.vibeTags), r.accent, r.isZeroProof ? 1 : 0,
      r.timesMade, r.lastMadeAt, r.isFavorite ? 1 : 0, r.rating, r.sourceUrl,
      r.sourceNote, r.theme, r.createdAt,
    ]
  );
}

/**
 * Adds any seed recipes the database has not seen before. Merging by id means
 * a library added in a later release reaches people who already opened the
 * app, while edits to an existing recipe are never overwritten.
 */
export function loadRecipes(profileId = 'default'): DrinkRecipe[] {
  const handle = sqlite(profileId);
  const existing = handle.getAllSync('SELECT id FROM recipes') as { id: string }[];
  const known = new Set(existing.map((r) => r.id));
  for (const r of SEED_RECIPES) {
    if (!known.has(r.id)) insertRecipe(r, profileId);
  }
  const rows = handle.getAllSync('SELECT * FROM recipes ORDER BY createdAt DESC') as any[];
  return rows.map(rowToRecipe);
}

export function saveRecipe(recipe: DrinkRecipe, profileId = 'default') {
  insertRecipe(recipe, profileId);
}

export function deleteRecipe(id: string, profileId = 'default') {
  sqlite(profileId).runSync('DELETE FROM recipes WHERE id = ?', [id]);
}

// ── Shopping list ──────────────────────────────────────────────────────────

export function loadShopping(profileId = 'default'): ShoppingItem[] {
  const rows = sqlite(profileId).getAllSync('SELECT * FROM shopping ORDER BY addedAt ASC') as any[];
  return rows.map((r) => ({ ...r, done: !!r.done }));
}

export function saveShoppingItem(item: ShoppingItem, profileId = 'default') {
  sqlite(profileId).runSync(
    `INSERT INTO shopping (id, catalogItemId, name, done, addedAt)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       catalogItemId=excluded.catalogItemId, name=excluded.name, done=excluded.done`,
    [item.id, item.catalogItemId, item.name, item.done ? 1 : 0, item.addedAt]
  );
}

export function deleteShoppingItem(id: string, profileId = 'default') {
  sqlite(profileId).runSync('DELETE FROM shopping WHERE id = ?', [id]);
}

// ── Prefs ──────────────────────────────────────────────────────────────────

export const DEFAULT_PREFS: Prefs = {
  ageGateAcceptedAt: null,
  zeroProofMode: false,
  allowSubstitutes: true,
  shakeToShake: true,
};

export function loadPrefs(profileId = 'default'): Prefs {
  const rows = sqlite(profileId).getAllSync('SELECT * FROM prefs') as { key: string; value: string }[];
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

export function savePrefs(prefs: Prefs, profileId = 'default') {
  const handle = sqlite(profileId);
  for (const [key, value] of Object.entries(prefs)) {
    handle.runSync(
      'INSERT INTO prefs (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
      [key, JSON.stringify(value)]
    );
  }
}

export function loadParty(profileId = 'default'): PartyPlan {
  const row = sqlite(profileId).getFirstSync<{ value: string }>('SELECT value FROM app_state WHERE key = ?', ['party']);
  try { return normalizeParty(row ? JSON.parse(row.value) : null); } catch { return normalizeParty(null); }
}
export function saveParty(party: PartyPlan, profileId = 'default') {
  sqlite(profileId).runSync('INSERT INTO app_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', ['party', JSON.stringify(normalizeParty(party))]);
}

export function loadProfileIndex(): ProfileIndex {
  try {
    const row = sqlite('default').getFirstSync<{ value: string }>('SELECT value FROM app_state WHERE key = ?', ['local-profiles:v1']);
    return readProfileIndex(row ? JSON.parse(row.value) : null);
  }
  catch { reportPersistenceError('read'); throw new Error('The local bar list could not be read. Your existing bar files have been kept.'); }
}
function saveIndex(index: ProfileIndex) {
  sqlite('default').runSync('INSERT INTO app_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', ['local-profiles:v1', JSON.stringify(readProfileIndex(index))]);
}
export function setActiveProfile(id: string): ProfileIndex {
  const index = loadProfileIndex();
  if (!index.profiles.some((p) => p.id === id)) throw new Error('That local bar could not be found.');
  const next = { ...index, activeId: id }; saveIndex(next); return next;
}
export function renameProfile(id: string, name: string): ProfileIndex {
  const next = renameLocalProfile(loadProfileIndex(), id, name); saveIndex(next); return next;
}
export function replaceProfileData(data: ProfileData, profileId = 'default') {
  const handle = sqlite(profileId);
  handle.withTransactionSync(() => {
    handle.execSync("DELETE FROM inventory; DELETE FROM recipes; DELETE FROM shopping; DELETE FROM prefs; DELETE FROM app_state WHERE key = 'party';");
    data.kit.forEach((item) => saveKitItem(item, profileId));
    data.recipes.forEach((recipe) => saveRecipe(recipe, profileId));
    data.shopping.forEach((item) => saveShoppingItem(item, profileId));
    savePrefs(data.prefs, profileId); saveParty(data.party, profileId);
  });
}
export function createProfile(name: string, data: ProfileData): ProfileIndex {
  const index = loadProfileIndex(); const profile = newLocalProfile(name, index);
  replaceProfileData(data, profile.id);
  // Only a complete, committed database is added to the local bar list.
  const next: ProfileIndex = { ...index, activeId: profile.id, profiles: [...index.profiles, profile] };
  saveIndex(next); return next;
}
export const scopedToProfile = (id: string) => bindProfileStore({ loadKit, saveKitItem, deleteKitItem, loadRecipes, saveRecipe, deleteRecipe, loadShopping, saveShoppingItem, deleteShoppingItem, loadPrefs, savePrefs, loadParty, saveParty, replaceProfileData }, id);
