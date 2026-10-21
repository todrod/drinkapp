import { CATALOG_BY_ID } from '../data/catalog';
import type { DrinkRecipe, PartyPlan, RecipeIngredient } from '../types';
import { isServingReady } from './recipes';

export const DEFAULT_PARTY: PartyPlan = { title: 'An evening with friends', entries: [], unit: 'ml' };
export const MAX_MENU = 6;
export const MAX_SERVINGS = 100;

export function validServings(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= MAX_SERVINGS;
}

/** Also bounds older/local data without changing its referenced recipes. */
export function normalizeParty(value: unknown): PartyPlan {
  if (!value || typeof value !== 'object') return { ...DEFAULT_PARTY, entries: [] };
  const p = value as Partial<PartyPlan>;
  const ids = new Set<string>();
  const entries = (Array.isArray(p.entries) ? p.entries : []).filter((e) => {
    if (!e || typeof e.recipeId !== 'string' || ids.has(e.recipeId) || !validServings(e.servings)) return false;
    ids.add(e.recipeId);
    return true;
  }).slice(0, MAX_MENU).map((e) => ({ recipeId: e.recipeId, servings: e.servings }));
  return { title: typeof p.title === 'string' ? p.title.slice(0, 80) : DEFAULT_PARTY.title, entries, unit: p.unit === 'oz' ? 'oz' : 'ml' };
}

const CARBONATED = new Set(['mx-soda', 'mx-tonic', 'mx-ginger-beer', 'mx-ginger-ale', 'mx-cola', 'mx-lemon-lime', 'wn-champagne', 'wn-prosecco']);
export function isCarbonated(ing: RecipeIngredient): boolean {
  const c = ing.catalogItemId ? CATALOG_BY_ID[ing.catalogItemId] : undefined;
  return !!(c && (CARBONATED.has(c.id) || c.kind === 'beer' || c.flavorNotes.includes('bubbly') || c.flavorNotes.includes('carbonated'))) ||
    /\b(tonic|soda|cola|sparkling|champagne|prosecco|ginger beer|ginger ale|beer)\b/i.test(ing.displayName);
}

/** Solids, foam, ice, bubbles and presentation are handled in the glass. */
export function addAtServing(ing: RecipeIngredient): boolean {
  return ing.isOptional || ing.role === 'ice' || ing.role === 'garnish' || isCarbonated(ing) ||
    ['piece', 'top', 'splash', 'part'].includes(ing.unit) || ing.amount === null ||
    /egg|aquafaba|espresso|cream|milk/i.test(ing.displayName);
}

const ML_PER_OZ = 29.5735295625;
const VOLUME_ML: Partial<Record<RecipeIngredient['unit'], number>> = { oz: ML_PER_OZ, ml: 1, tsp: 4.92892159375 };
export interface BatchLine {
  key: string;
  catalogItemId: string | null;
  name: string;
  amount: number | null;
  unit: string;
  atServing: boolean;
  optional: boolean;
  perServing: string | null;
}

function numberLabel(n: number): string { return String(Math.round((n + Number.EPSILON) * 100) / 100); }
export function batchLineLabel(line: BatchLine): string {
  const measure = line.amount === null ? line.perServing ?? 'As needed' : `${numberLabel(line.amount)} ${line.unit}`;
  return `${measure} · ${line.name}${line.optional ? ' (optional)' : ''}`;
}

export function batchRecipe(recipe: DrinkRecipe, servings: number, unit: 'oz' | 'ml'): BatchLine[] {
  if (!validServings(servings) || !isServingReady(recipe)) return [];
  return recipe.ingredients.map((ing, index) => {
    const volume = VOLUME_ML[ing.unit];
    // A dash has no universal mL size; "parts" need a chosen measure first.
    const scalable = ing.amount !== null && ing.unit !== 'part' && ing.unit !== 'top' && ing.unit !== 'splash';
    const amount = scalable ? volume ? ing.amount! * servings * volume / (unit === 'ml' ? 1 : ML_PER_OZ) : ing.amount! * servings : null;
    const outUnit = volume ? unit : ing.unit === 'piece' ? 'pieces' : ing.unit === 'dash' ? 'dashes' : ing.unit;
    const perServing = !scalable ? ing.unit === 'part' ? `${numberLabel(ing.amount ?? 1)} parts per serving; choose a measure` :
      ing.unit === 'top' ? `Top ${servings === 1 ? 'the glass' : `each of ${servings} glasses`}` : ing.unit === 'splash' ? `A splash per glass · ${servings} ${servings === 1 ? 'glass' : 'glasses'}` : `As needed · ${servings} ${servings === 1 ? 'serving' : 'servings'}` : null;
    return { key: `${recipe.id}-${index}`, catalogItemId: ing.catalogItemId, name: ing.displayName,
      amount, unit: outUnit, atServing: addAtServing(ing), optional: ing.isOptional, perServing };
  });
}

export function menuTotals(entries: { recipe: DrinkRecipe; servings: number }[], unit: 'oz' | 'ml'): BatchLine[] {
  const map = new Map<string, BatchLine>();
  for (const { recipe, servings } of entries) {
    for (const line of batchRecipe(recipe, servings, unit)) {
      const key = `${line.catalogItemId ?? line.name.trim().toLowerCase()}|${line.unit}|${line.optional}|${line.amount === null ? line.key : 'measured'}`;
      const existing = map.get(key);
      if (existing && existing.amount !== null && line.amount !== null) existing.amount += line.amount;
      else map.set(key, { ...line, key });
    }
  }
  return [...map.values()];
}

export function prepAdvice(recipe: DrinkRecipe): string {
  const method = recipe.method;
  if (method === 'blend' || method === 'muddle') return 'Measure the liquids ahead. Blend or muddle individual drinks using the original steps when serving.';
  if (method === 'shake') return 'Combine only the measured still liquids ahead and chill. Shake one measured portion with ice when serving; add bubbles afterward. Follow the original steps for layers and foam.';
  if (method === 'stir') return 'Combine the measured still liquids ahead and chill. Stir one measured portion with ice when serving for the recipe’s dilution.';
  return 'Measure the still liquids ahead and chill. Build each glass following the original steps; add ice, bubbles and finishing ingredients at serving.';
}
