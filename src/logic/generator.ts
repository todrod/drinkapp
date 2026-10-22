import { CATALOG_BY_ID } from '../data/catalog';
import { discoverDrinks, ideaAllowsSubstitution } from './discovery';
import { isAlcoholFree, isServingReady } from './recipes';
import {
  DrinkRecipe,
  GeneratorResult,
  InventoryItem,
  RecipeIngredient,
  RandomSource,
  Substitution,
} from '../types';

/**
 * The matching algorithm — Phase 03 of the build spec.
 *
 * Inventory mode never returns a drink the user cannot actually pour.
 * Explicit all-recipes mode ignores stock for inspiration, keeping the same
 * completeness, alcohol-free and discovery filters without inventing ownership.
 */

/** Roles that must resolve. A missing garnish or ice is a note, not a veto. */
const HARD_ROLES = new Set(['base', 'modifier', 'mixer', 'sweetener']);

export interface Owned {
  ids: Set<string>;
  /** Free-typed items, matched by lowercased name. */
  names: Set<string>;
}

export function buildOwned(kit: InventoryItem[]): Owned {
  const ids = new Set<string>();
  const names = new Set<string>();
  for (const item of kit) {
    if (item.level === 'out') continue;
    if (item.catalogItemId) ids.add(item.catalogItemId);
    names.add(item.name.trim().toLowerCase());
  }
  // Staples are assumed on hand whether or not the user listed them.
  for (const c of Object.values(CATALOG_BY_ID)) {
    if (c.isStaple) ids.add(c.id);
  }
  return { ids, names };
}

interface Resolution {
  resolved: boolean;
  substitution?: Substitution;
}

function resolveIngredient(
  ing: RecipeIngredient,
  owned: Owned,
  allowSubstitutes: boolean,
  excludedIds?: Set<string>,
  allowSubstitution?: (wantedId: string, usedId: string) => boolean
): Resolution {
  if (ing.catalogItemId && excludedIds?.has(ing.catalogItemId)) return { resolved: false };
  if (ing.catalogItemId && owned.ids.has(ing.catalogItemId)) return { resolved: true };
  if (owned.names.has(ing.displayName.trim().toLowerCase())) return { resolved: true };

  if (allowSubstitutes && ing.catalogItemId) {
    const cat = CATALOG_BY_ID[ing.catalogItemId];
    if (cat) {
      for (const subId of cat.substituteIds) {
        if (excludedIds?.has(subId)) continue;
        if (allowSubstitution && !allowSubstitution(cat.id, subId)) continue;
        if (owned.ids.has(subId)) {
          return {
            resolved: true,
            substitution: {
              wanted: cat.name,
              used: CATALOG_BY_ID[subId]?.name ?? subId,
            },
          };
        }
      }
    }
  }
  return { resolved: false };
}

export interface MatchResult {
  ok: boolean;
  substitutions: Substitution[];
  /** Required ingredients the kit is missing, by display name. */
  missing: string[];
  /** Garnish or ice that is missing — worth mentioning, not worth blocking. */
  softMissing: string[];
}

export function matchRecipe(
  recipe: DrinkRecipe,
  owned: Owned,
  allowSubstitutes: boolean,
  excludedIds?: Set<string>,
  allowSubstitution?: (wantedId: string, usedId: string) => boolean
): MatchResult {
  const substitutions: Substitution[] = [];
  const missing: string[] = [];
  const softMissing: string[] = [];
  const protectAlcoholFree = isAlcoholFree(recipe);

  for (const ing of recipe.ingredients) {
    if (ing.isOptional) continue;
    const hard = HARD_ROLES.has(ing.role);
    const res = resolveIngredient(ing, owned, allowSubstitutes, excludedIds, (wanted, used) =>
      (!protectAlcoholFree || CATALOG_BY_ID[used]?.typicalAbv === 0) && (!allowSubstitution || allowSubstitution(wanted, used)));

    if (res.resolved) {
      if (res.substitution) substitutions.push(res.substitution);
    } else if (hard) {
      missing.push(ing.displayName);
    } else {
      softMissing.push(ing.displayName);
    }
  }

  // A recipe with nothing in it satisfies "every required ingredient resolves"
  // vacuously, which let a half-written user recipe be served as a pourable
  // drink reading "0/0 ON HAND". Pourable requires something to pour.
  const pourable = recipe.ingredients.some(
    (i) => !i.isOptional && HARD_ROLES.has(i.role)
  );

  return {
    ok: pourable && isServingReady(recipe) && missing.length === 0,
    substitutions,
    missing,
    softMissing,
  };
}

export interface GenerateOptions {
  /** Omission preserves the original strict inventory behavior. */
  source?: RandomSource;
  recipes: DrinkRecipe[];
  kit: InventoryItem[];
  allowSubstitutes: boolean;
  zeroProofMode: boolean;
  /** Active vibe chips. Empty means no filtering. */
  vibes: string[];
  /** Active themed collections. Empty means no filtering. */
  themes?: string[];
  /** Catalog id the drink must use. */
  lockedIngredientId?: string | null;
  /** Recipe ids from the last few runs, pushed down the ranking. */
  recentIds?: string[];
  /** Local keyword/topic request. All recognized terms intersect; exclusions also apply to substitutions. */
  ideaQuery?: string;
}

function passesFilters(r: DrinkRecipe, o: GenerateOptions): boolean {
  if (o.zeroProofMode && !isAlcoholFree(r)) return false;
  if (o.vibes.length && !o.vibes.some((v) => r.vibeTags.includes(v))) return false;
  if (o.themes?.length && (!r.theme || !o.themes.includes(r.theme))) return false;
  if (o.lockedIngredientId) {
    const uses = r.ingredients.some((i) => i.catalogItemId === o.lockedIngredientId);
    if (!uses) return false;
  }
  return true;
}

function score(r: DrinkRecipe, m: Pick<MatchResult, 'substitutions' | 'softMissing'>, recentIds: string[]): number {
  let s = 100;
  if (r.timesMade === 0) s += 40; // reward the untried
  if (recentIds.includes(r.id)) s -= 70; // don't repeat yourself
  if (m.substitutions.length) s -= 12 * m.substitutions.length;
  if (m.softMissing.length) s -= 4 * m.softMissing.length;
  if (r.isFavorite) s += 15;
  if (r.origin === 'user') s += 10; // their own recipes deserve a nudge
  return Math.max(s, 1);
}

/** Weighted pick — a strictly-best "random" button gets boring fast. */
function weightedPick<T>(entries: { item: T; weight: number }[]): T {
  const total = entries.reduce((a, e) => a + e.weight, 0);
  let roll = Math.random() * total;
  for (const e of entries) {
    roll -= e.weight;
    if (roll <= 0) return e.item;
  }
  return entries[entries.length - 1].item;
}

export function resolveRandomSource(saved: unknown, kit: InventoryItem[]): RandomSource {
  if (saved === 'all' || saved === 'inventory') return saved;
  return kit.some((item) => item.level !== 'out') ? 'inventory' : 'all';
}

export function generate(o: GenerateOptions): GeneratorResult {
  const owned = buildOwned(o.kit);
  const recentIds = o.recentIds ?? [];

  const idea = o.ideaQuery?.trim() ? discoverDrinks(o.recipes, o.ideaQuery) : null;
  const relevance = new Map(idea?.matches.map((m) => [m.recipe.id, m.score]) ?? []);
  const excludedIds = idea?.intent.excludedIngredientIds;
  const allowIdeaSubstitution = idea ? (wanted: string, used: string) => ideaAllowsSubstitution(idea.intent, wanted, used) : undefined;
  const filtered = o.recipes.filter((r) => passesFilters(r, o) && (!idea || relevance.has(r.id)));

  if (o.source === 'all') {
    const complete = filtered.filter(isServingReady);
    if (complete.length) {
      // Every matching recipe stays in the pool, including the end of the book.
      const recipe = weightedPick(complete.map((r) => ({ item: r, weight: score(r, { substitutions: [], softMissing: [] }, recentIds) + (relevance.get(r.id) ?? 0) })));
      return { ok: true, recipe, substitutions: [] };
    }
    const available = o.recipes.filter((r) => isServingReady(r) && (!o.zeroProofMode || isAlcoholFree(r))).length;
    return { ok: false, reason: idea ? 'idea' : available ? 'filters' : 'library', suggestions: [], matchesWithoutFilters: available, ...(idea ? { ideaMatches: idea.matches.length } : {}) };
  }

  const hits: { item: { recipe: DrinkRecipe; match: MatchResult }; weight: number }[] = [];

  for (const r of filtered) {
    const m = matchRecipe(r, owned, o.allowSubstitutes, excludedIds, allowIdeaSubstitution);
    if (m.ok) hits.push({ item: { recipe: r, match: m }, weight: score(r, m, recentIds) + (relevance.get(r.id) ?? 0) });
  }

  if (hits.length) {
    // Pick from the top half so scoring matters without becoming deterministic.
    hits.sort((a, b) => b.weight - a.weight);
    const pool = hits.slice(0, Math.max(3, Math.ceil(hits.length / 2)));
    const chosen = weightedPick(pool);
    return {
      ok: true,
      recipe: chosen.recipe,
      substitutions: chosen.match.substitutions,
    };
  }

  // ── Nothing matched. Work out the cheapest way to fix that. ──────────────

  const unfilteredMakeable = o.recipes.filter(
    (r) => (!o.zeroProofMode || isAlcoholFree(r)) && matchRecipe(r, owned, o.allowSubstitutes).ok
  ).length;

  const filtersAreTheProblem =
    unfilteredMakeable > 0 &&
    (o.vibes.length > 0 ||
      !!o.lockedIngredientId ||
      o.zeroProofMode ||
      (o.themes?.length ?? 0) > 0);

  if (filtersAreTheProblem && !idea) {
    return {
      ok: false,
      reason: 'filters',
      suggestions: [],
      matchesWithoutFilters: unfilteredMakeable,
    };
  }

  // Which single ingredient unlocks the most drinks?
  const unlocks = new Map<string, number>();
  const idByName = new Map<string, string | null>();
  // Never broaden a typed request silently (especially "no gin" or "mocktail").
  const pool = filtered;
  for (const r of pool) {
    if (!isServingReady(r)) continue;
    const m = matchRecipe(r, owned, o.allowSubstitutes, excludedIds, allowIdeaSubstitution);
    if (m.missing.length === 1) {
      const key = m.missing[0];
      unlocks.set(key, (unlocks.get(key) ?? 0) + 1);
      if (!idByName.has(key)) {
        const ing = r.ingredients.find((i) => i.displayName === key);
        idByName.set(key, ing?.catalogItemId ?? null);
      }
    }
  }

  const suggestions = Array.from(unlocks.entries())
    .map(([name, count]) => ({
      name,
      catalogItemId: idByName.get(name) ?? null,
      unlocks: count,
    }))
    .sort((a, b) => b.unlocks - a.unlocks)
    .slice(0, 3);

  return {
    ok: false,
    reason: suggestions.length ? 'nearly' : idea ? 'idea' : 'empty',
    suggestions,
    matchesWithoutFilters: unfilteredMakeable,
    ...(idea ? { ideaMatches: idea.matches.length } : {}),
  };
}

/** How many drinks the current kit can pour — used by Explore and My Kit. */
export function countMakeable(
  recipes: DrinkRecipe[],
  kit: InventoryItem[],
  allowSubstitutes: boolean,
  zeroProofMode = false
): number {
  const owned = buildOwned(kit);
  return recipes.filter((r) => (!zeroProofMode || isAlcoholFree(r)) && matchRecipe(r, owned, allowSubstitutes).ok).length;
}

/**
 * How many drinks would open up if this one catalog item were added.
 * Powers Explore's "adds 6 drinks" line, which is the whole conversion pitch.
 */
export function countUnlockedBy(
  catalogId: string,
  recipes: DrinkRecipe[],
  kit: InventoryItem[],
  allowSubstitutes: boolean
): number {
  const owned = buildOwned(kit);
  if (owned.ids.has(catalogId)) return 0;

  const before = recipes.filter((r) => matchRecipe(r, owned, allowSubstitutes).ok).length;
  const withItem: Owned = { ids: new Set(owned.ids), names: new Set(owned.names) };
  withItem.ids.add(catalogId);
  const after = recipes.filter((r) => matchRecipe(r, withItem, allowSubstitutes).ok).length;
  return after - before;
}
