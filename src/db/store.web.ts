import { DrinkRecipe, InventoryItem, Prefs } from '../types';
import { SEED_RECIPES } from '../data/recipes';

/**
 * Persistence — web.
 *
 * Metro picks this file over `store.ts` for the web bundle, which keeps
 * expo-sqlite's native module out of the static export entirely. Same exported
 * functions, backed by localStorage: at a few hundred rows the wasm SQLite
 * pipeline buys nothing.
 *
 * Every read and write is guarded — private windows and blocked site data make
 * the accessor itself throw, and the app should still run, just forgetfully.
 */

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

// ── Inventory ──────────────────────────────────────────────────────────────

export function loadKit(): InventoryItem[] {
  return lsGet<InventoryItem[]>('kit', []);
}

export function saveKitItem(item: InventoryItem) {
  const kit = lsGet<InventoryItem[]>('kit', []);
  const i = kit.findIndex((k) => k.id === item.id);
  if (i >= 0) kit[i] = item;
  else kit.unshift(item);
  lsSet('kit', kit);
}

export function deleteKitItem(id: string) {
  lsSet('kit', lsGet<InventoryItem[]>('kit', []).filter((k) => k.id !== id));
}

// ── Recipes ────────────────────────────────────────────────────────────────

/** Merges in seed recipes not seen before; never overwrites an edited one. */
export function loadRecipes(): DrinkRecipe[] {
  const stored = lsGet<DrinkRecipe[]>('recipes', []);
  const known = new Set(stored.map((r) => r.id));
  const missing = SEED_RECIPES.filter((r) => !known.has(r.id));
  if (missing.length === 0) return stored;

  const merged = [...missing, ...stored];
  lsSet('recipes', merged);
  return merged;
}

export function saveRecipe(recipe: DrinkRecipe) {
  const all = lsGet<DrinkRecipe[]>('recipes', []);
  const i = all.findIndex((r) => r.id === recipe.id);
  if (i >= 0) all[i] = recipe;
  else all.unshift(recipe);
  lsSet('recipes', all);
}

export function deleteRecipe(id: string) {
  lsSet('recipes', lsGet<DrinkRecipe[]>('recipes', []).filter((r) => r.id !== id));
}

// ── Prefs ──────────────────────────────────────────────────────────────────

export const DEFAULT_PREFS: Prefs = {
  ageGateAcceptedAt: null,
  zeroProofMode: false,
  allowSubstitutes: true,
};

export function loadPrefs(): Prefs {
  return { ...DEFAULT_PREFS, ...lsGet<Partial<Prefs>>('prefs', {}) };
}

export function savePrefs(prefs: Prefs) {
  lsSet('prefs', prefs);
}
