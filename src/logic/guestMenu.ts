import { compressToEncodedURIComponent } from 'lz-string';
import { decompressMenu } from './menuCompression';
import { SEED_RECIPES } from '../data/recipes';
import type { DrinkRecipe, RecipeIngredient } from '../types';
import { alcoholStatus, blankRecipe, isServingReady } from './recipes';
import { MAX_MENU } from './hosting';

export interface GuestMenu { title: string; recipes: DrinkRecipe[] }
const seeds = new Map(SEED_RECIPES.map((r) => [r.id, r]));
const METHODS = ['shake', 'stir', 'build', 'blend', 'muddle'];
const UNITS = ['oz', 'ml', 'dash', 'splash', 'part', 'piece', 'tsp', 'top'];
const ROLES = ['base', 'modifier', 'mixer', 'sweetener', 'garnish', 'ice'];
const boundedText = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max;

/** An allowlist: no cabinet, serving counts, ratings, preferences or history. */
function snapshot(r: DrinkRecipe) {
  return { n: r.name, m: r.method, g: r.glass, f: r.garnish, s: r.steps,
    i: r.ingredients.map((i) => [i.catalogItemId, i.displayName, i.amount, i.unit, i.role, i.isOptional ? 1 : 0, i.alcohol ?? 'unknown']) };
}

function snapshotHash(r: DrinkRecipe): string {
  let hash = 2166136261;
  for (const char of JSON.stringify(snapshot(r))) hash = Math.imul(hash ^ char.codePointAt(0)!, 16777619);
  return (hash >>> 0).toString(36);
}

export function encodeGuestMenu(title: string, recipes: DrinkRecipe[]): string {
  if (!recipes.length || recipes.length > MAX_MENU || recipes.some((r) => !isServingReady(r))) throw new Error('Choose complete recipes for the menu.');
  const r = recipes.map((recipe) => {
    const seed = seeds.get(recipe.id);
    return seed && JSON.stringify(snapshot(recipe)) === JSON.stringify(snapshot(seed)) ? `${recipe.id}~${snapshotHash(seed)}` : snapshot(recipe);
  });
  const token = compressToEncodedURIComponent(JSON.stringify({ v: 1, t: title.trim().slice(0, 80) || 'Tonight’s drinks', r }));
  if (token.length > 10000) throw new Error('This menu is too long to share. Shorten the custom recipe instructions.');
  if (!decodeGuestMenu(token)) throw new Error('A custom recipe is too detailed to share. Use up to 30 ingredients and 20 steps, with at most 1,000 characters per step.');
  return token;
}

export function decodeGuestMenu(token: string): GuestMenu | null {
  if (!token || token.length > 10000 || !/^[A-Za-z0-9+$-]+$/.test(token)) return null;
  try {
    const text = decompressMenu(token);
    if (!text || text.length > 50000) return null;
    const payload = JSON.parse(text);
    if (payload.v !== 1 || !boundedText(payload.t, 80) || !Array.isArray(payload.r) || !payload.r.length || payload.r.length > MAX_MENU) return null;
    const recipes: DrinkRecipe[] = [];
    for (const [index, entry] of payload.r.entries()) {
      if (typeof entry === 'string') {
        const [id, hash] = entry.split('~');
        const seed = seeds.get(id);
        if (!seed || snapshotHash(seed) !== hash) return null;
        recipes.push({ ...seed, isFavorite: false, timesMade: 0, lastMadeAt: null, rating: null });
        continue;
      }
      if (!entry || !boundedText(entry.n, 100) || !METHODS.includes(entry.m) || !(entry.g === null || boundedText(entry.g, 60)) || !(entry.f === null || boundedText(entry.f, 200)) ||
        !Array.isArray(entry.s) || !entry.s.length || entry.s.length > 20 || !entry.s.every((s: unknown) => boundedText(s, 1000)) || !Array.isArray(entry.i) || entry.i.length > 30) return null;
      const ingredients: RecipeIngredient[] = [];
      for (const i of entry.i) {
        if (!Array.isArray(i) || i.length !== 7 || !(i[0] === null || boundedText(i[0], 100)) || !boundedText(i[1], 100) ||
          !(i[2] === null || typeof i[2] === 'number' && Number.isFinite(i[2]) && i[2] > 0 && i[2] <= 10000) ||
          !UNITS.includes(i[3]) || !ROLES.includes(i[4]) || ![0, 1].includes(i[5]) || !['none', 'contains', 'unknown'].includes(i[6])) return null;
        ingredients.push({ catalogItemId: i[0], displayName: i[1], amount: i[2], unit: i[3], role: i[4], isOptional: i[5] === 1, alcohol: i[6] });
      }
      const recipe: DrinkRecipe = { ...blankRecipe(), id: `guest-${index}`, name: entry.n, method: entry.m, glass: entry.g, garnish: entry.f, steps: entry.s, ingredients };
      recipe.isZeroProof = alcoholStatus(recipe) === 'none';
      if (!isServingReady(recipe)) return null;
      recipes.push(recipe);
    }
    return { title: payload.t, recipes };
  } catch { return null; }
}

export function menuLink(base: string, token: string): string {
  const url = new URL(base);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Use the web address where this app is available.');
  url.hash = `menu=${token}`;
  return url.toString();
}

export function tokenFromUrl(url: string): string | null {
  const hash = url.split('#')[1] ?? '';
  return hash.startsWith('menu=') ? hash.slice(5) : null;
}
