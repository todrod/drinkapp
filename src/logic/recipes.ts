import { CATALOG_BY_ID } from '../data/catalog';
import type { DrinkRecipe, RecipeIngredient, Role } from '../types';

const HARD_ROLES = new Set<Role>(['base', 'modifier', 'mixer', 'sweetener']);

export function ingredientAlcohol(ing: RecipeIngredient): 'none' | 'contains' | 'unknown' {
  const cat = ing.catalogItemId ? CATALOG_BY_ID[ing.catalogItemId] : undefined;
  return cat ? cat.typicalAbv === 0 ? 'none' : 'contains' : ing.alcohol ?? 'unknown';
}

/** Never trust a legacy boolean when ingredients can establish a stronger answer. */
export function alcoholStatus(recipe: DrinkRecipe): 'none' | 'contains' | 'unknown' {
  if (!recipe.ingredients.length) return 'unknown';
  const states = recipe.ingredients.map(ingredientAlcohol);
  if (states.includes('contains')) return 'contains';
  return states.includes('unknown') ? 'unknown' : 'none';
}

export const isAlcoholFree = (recipe: DrinkRecipe) => alcoholStatus(recipe) === 'none';

export function recipeIssues(recipe: DrinkRecipe): string[] {
  const issues: string[] = [];
  if (!recipe.name.trim()) issues.push('Add a name.');
  if (!recipe.ingredients.some((i) => !i.isOptional && HARD_ROLES.has(i.role))) issues.push('Add a required drink ingredient.');
  if (recipe.ingredients.some((i) => i.amount !== null && (!Number.isFinite(i.amount) || i.amount <= 0))) issues.push('Amounts must be greater than zero.');
  if (recipe.ingredients.some((i) => !i.isOptional && HARD_ROLES.has(i.role) && i.amount === null && !['top', 'splash', 'piece'].includes(i.unit))) {
    issues.push('Add measures for the required ingredients, or choose “top” / “splash”.');
  }
  if (!recipe.steps.some((s) => s.trim()) || recipe.steps.some((s) => s.startsWith('Built in the Drink Builder'))) issues.push('Write the mixing steps.');
  return issues;
}

export const isServingReady = (recipe: DrinkRecipe) => recipeIssues(recipe).length === 0;

export function roleForCatalog(id: string | null): Role {
  const c = id ? CATALOG_BY_ID[id] : null;
  return c?.category === 'beverage' ? 'base' : c?.category === 'sweet' ? 'sweetener' :
    c?.category === 'garnish' ? 'garnish' : c?.category === 'ice' ? 'ice' : c?.category === 'flavor' ? 'modifier' : 'mixer';
}

export function blankRecipe(): DrinkRecipe {
  return {
    id: 'user-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    name: '', origin: 'user', method: 'build', glass: null, ingredients: [], steps: [], garnish: null,
    vibeTags: [], accent: '#F2B88D', isZeroProof: false, timesMade: 0, lastMadeAt: null,
    isFavorite: false, rating: null, sourceUrl: null, sourceNote: null, theme: null, createdAt: Date.now(),
  };
}
