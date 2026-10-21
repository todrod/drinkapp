import type { DrinkRecipe } from '../types';
import { normalizeText } from '../logic/text';
import { isAlcoholFree } from '../logic/recipes';

export const CURATION_DATE = '21 Oct 2026';
export const TREND_SOURCE = 'https://www.bacardilimited.com/media/news-archive/connections-local-flavors-and-luxurious-experiences-top-the-2026-bacardi-cocktail-trends-report/';
export const RATING_SOURCE = 'https://www.diffordsguide.com/cocktails/search?na=1&s=1&so=dg_rating';
const names = (values: string[]) => new Set(values.map(normalizeText));

// Forecasted bar calls, not real-time searches or a claim about universal popularity.
const TRENDING = names(['Margarita', 'Mojito', 'Piña Colada', 'Rum & Coke', 'Whisky & Coke',
  'Aperol Spritz', 'Vodka Lemonade', 'Vodka Soda', 'Gin & Tonic', 'Dry Martini']);
export function trendingRank(recipe: DrinkRecipe): number {
  const index = recipe.origin === 'seed' ? [...TRENDING].indexOf(normalizeText(recipe.name)) : -1;
  return index < 0 ? Infinity : index + 1;
}
// Cocktail families on the first page of Difford's rating-sorted finder when checked.
// The app's specs can differ from Difford's: these never populate the user's stars.
const HIGHLY_RATED = names(['Daiquiri', 'Dry Martini', 'Last Word', 'Margarita', 'Martinez',
  'Negroni', 'Penicillin', 'Mezcal Margarita', 'Naked and Famous', 'Brooklyn', 'Clover Club']);
// An editorial collection, deliberately distinct from the user's own favorites.
const ALL_TIME = names(['Margarita', 'Mojito', 'Old Fashioned', 'Negroni', 'Daiquiri', 'Manhattan',
  'Dry Martini', 'Whiskey Sour', 'Espresso Martini', 'Piña Colada', 'Cosmopolitan', 'Moscow Mule',
  'Mai Tai', 'Paloma', 'Aperol Spritz', 'Gin & Tonic', 'Bloody Mary', 'French 75', 'Sidecar',
  'Bellini', 'Mint Julep', 'Singapore Sling', 'Tequila Sunrise', 'White Russian', 'Amaretto Sour']);

export type Collection = 'trending' | 'highly-rated' | 'all-time' | 'classic' | 'specialty' | 'zero-proof' | 'themed';
export function inCollection(recipe: DrinkRecipe, collection: Collection): boolean {
  const name = normalizeText(recipe.name);
  const bundled = recipe.origin === 'seed';
  switch (collection) {
    case 'trending': return bundled && TRENDING.has(name);
    case 'highly-rated': return bundled && HIGHLY_RATED.has(name);
    case 'all-time': return bundled && ALL_TIME.has(name);
    case 'classic': return !recipe.theme && (recipe.id.startsWith('book-') ||
      recipe.vibeTags.some((t) => t === 'classic' || t === 'modern-classic') || (bundled && ALL_TIME.has(name)));
    case 'specialty': return recipe.vibeTags.some((t) => ['specialty', 'dessert', 'complex', 'tiki'].includes(t));
    case 'zero-proof': return isAlcoholFree(recipe);
    case 'themed': return !!recipe.theme;
  }
}

export function curationSources(recipe: DrinkRecipe): { label: string; url: string }[] {
  const sources = [];
  if (inCollection(recipe, 'trending')) sources.push({ label: `Bacardi 2026 popularity forecast · checked ${CURATION_DATE}`, url: TREND_SOURCE });
  if (inCollection(recipe, 'highly-rated')) sources.push({ label: `Difford’s highly rated cocktail family · checked ${CURATION_DATE}`, url: RATING_SOURCE });
  return sources;
}
