import { CATALOG, CATALOG_BY_ID } from '../data/catalog';
import { buildOwned, matchRecipe, Owned } from './generator';
import { DrinkRecipe, InventoryItem } from '../types';

/**
 * Shopping intelligence.
 *
 * The generator already knows a kit is one bottle short of six drinks. This
 * turns that into a ranked list you can take to a shop, and projects what the
 * whole list would unlock together — which is not the sum of the parts, since
 * two bottles often unlock the same drink.
 */

export interface Suggestion {
  catalogItemId: string;
  name: string;
  /** Drinks this one bottle unlocks on its own. */
  unlocks: number;
}

/** Owned set plus some extra catalog ids, without touching the real kit. */
function ownedPlus(base: Owned, extraIds: string[]): Owned {
  const ids = new Set(base.ids);
  for (const id of extraIds) ids.add(id);
  return { ids, names: base.names };
}

function countMatches(
  recipes: DrinkRecipe[],
  owned: Owned,
  allowSubstitutes: boolean
): number {
  let n = 0;
  for (const r of recipes) if (matchRecipe(r, owned, allowSubstitutes).ok) n++;
  return n;
}

/**
 * Every catalog item that would unlock at least one drink, best first.
 *
 * Deliberately a full sweep rather than only looking at recipes that are one
 * ingredient short: a bottle that completes two different two-short recipes is
 * worth surfacing, and at ~150 items by ~96 recipes the cost is trivial.
 */
export function rankPurchases(
  recipes: DrinkRecipe[],
  kit: InventoryItem[],
  allowSubstitutes: boolean,
  opts: { exclude?: Set<string>; limit?: number } = {}
): Suggestion[] {
  const base = buildOwned(kit);
  const before = countMatches(recipes, base, allowSubstitutes);
  const out: Suggestion[] = [];

  for (const item of CATALOG) {
    if (base.ids.has(item.id)) continue;
    if (opts.exclude?.has(item.id)) continue;

    const after = countMatches(recipes, ownedPlus(base, [item.id]), allowSubstitutes);
    const unlocks = after - before;
    if (unlocks > 0) out.push({ catalogItemId: item.id, name: item.name, unlocks });
  }

  out.sort((a, b) => b.unlocks - a.unlocks || a.name.localeCompare(b.name));
  return opts.limit ? out.slice(0, opts.limit) : out;
}

export interface Projection {
  /** Pourable now. */
  current: number;
  /** Pourable if every listed item were bought. */
  projected: number;
  total: number;
}

/**
 * What the list as a whole gets you.
 *
 * Buying two bottles that unlock the same drink does not unlock it twice, so
 * this evaluates them together rather than summing the individual figures.
 */
export function projectList(
  recipes: DrinkRecipe[],
  kit: InventoryItem[],
  catalogIds: string[],
  allowSubstitutes: boolean
): Projection {
  const base = buildOwned(kit);
  const ids = catalogIds.filter((id) => CATALOG_BY_ID[id]);
  return {
    current: countMatches(recipes, base, allowSubstitutes),
    projected: countMatches(recipes, ownedPlus(base, ids), allowSubstitutes),
    total: recipes.length,
  };
}

/** Drinks a given purchase would newly make pourable, by name. */
export function unlockedBy(
  catalogId: string,
  recipes: DrinkRecipe[],
  kit: InventoryItem[],
  allowSubstitutes: boolean
): string[] {
  const base = buildOwned(kit);
  if (base.ids.has(catalogId)) return [];
  const after = ownedPlus(base, [catalogId]);

  return recipes
    .filter(
      (r) =>
        !matchRecipe(r, base, allowSubstitutes).ok &&
        matchRecipe(r, after, allowSubstitutes).ok
    )
    .map((r) => r.name);
}
