// Data models — Phase 02 of the build spec.

export type Category =
  | 'beverage'
  | 'mixer'
  | 'garnish'
  | 'flavor'
  | 'ice'
  | 'glass'
  | 'sweet'
  | 'tool'
  | 'vibe';

export const CATEGORIES: Category[] = [
  'beverage',
  'mixer',
  'garnish',
  'flavor',
  'ice',
  'glass',
  'sweet',
  'tool',
  'vibe',
];

export const CATEGORY_LABEL: Record<Category, string> = {
  beverage: 'Beverage',
  mixer: 'Mixer',
  garnish: 'Garnish',
  flavor: 'Flavor',
  ice: 'Ice',
  glass: 'Glass',
  sweet: 'Sweet',
  tool: 'Tool',
  vibe: 'Vibe',
};

export const CATEGORY_ICON: Record<Category, string> = {
  beverage: '🥃',
  mixer: '🥤',
  garnish: '🍋',
  flavor: '🌿',
  ice: '🧊',
  glass: '🥂',
  sweet: '🍯',
  tool: '🍸',
  vibe: '🎉',
};

export type Kind =
  | 'spirit'
  | 'liqueur'
  | 'wine'
  | 'beer'
  | 'mixer'
  | 'syrup'
  | 'bitters'
  | 'garnish'
  | 'ice'
  | 'tool'
  | 'glass'
  | 'extra';

export type SpiritType =
  | 'vodka'
  | 'gin'
  | 'rum'
  | 'tequila'
  | 'mezcal'
  | 'whiskey'
  | 'brandy'
  | 'aperitif';

export type Level = 'full' | 'half' | 'low' | 'out';
export const LEVELS: Level[] = ['full', 'half', 'low', 'out'];

export type Unit = 'oz' | 'ml' | 'dash' | 'splash' | 'part' | 'piece' | 'tsp' | 'top';

export type Role =
  | 'base'
  | 'modifier'
  | 'mixer'
  | 'sweetener'
  | 'garnish'
  | 'ice';

export type Method = 'shake' | 'stir' | 'build' | 'blend' | 'muddle';

export interface CatalogItem {
  id: string;
  name: string;
  kind: Kind;
  category: Category;
  spiritType: SpiritType | null;
  styleSubtype: string | null;
  typicalAbv: number;
  flavorNotes: string[];
  substituteIds: string[];
  blurb: string;
  isZeroProof: boolean;
  isStaple: boolean;
  icon: string;
}

/** Authoring shape for bundled catalog data — expanded into CatalogItem. */
export interface CatalogRow {
  id: string;
  name: string;
  kind: Kind;
  category: Category;
  spirit?: SpiritType;
  style?: string;
  abv?: number;
  notes?: string[];
  subs?: string[];
  blurb: string;
  staple?: boolean;
  icon: string;
}

export interface InventoryItem {
  id: string;
  catalogItemId: string | null;
  name: string;
  category: Category;
  brand: string | null;
  level: Level;
  isStaple: boolean;
  icon: string;
  addedAt: number;
  updatedAt: number;
}

export interface RecipeIngredient {
  catalogItemId: string | null;
  displayName: string;
  amount: number | null;
  unit: Unit;
  role: Role;
  isOptional: boolean;
}

export interface DrinkRecipe {
  id: string;
  name: string;
  origin: 'user' | 'seed' | 'generated' | 'trending';
  method: Method;
  glass: string | null;
  ingredients: RecipeIngredient[];
  steps: string[];
  garnish: string | null;
  vibeTags: string[];
  accent: string;
  isZeroProof: boolean;
  timesMade: number;
  lastMadeAt: number | null;
  isFavorite: boolean;
  sourceUrl: string | null;
  createdAt: number;
}

export interface Prefs {
  ageGateAcceptedAt: number | null;
  zeroProofMode: boolean;
  allowSubstitutes: boolean;
}

// ── Generator result shapes ───────────────────────────────────────────────
// The generator never returns a drink it cannot fully pour. When nothing
// matches it returns a typed miss so the UI can name the fix.

export interface Substitution {
  wanted: string;
  used: string;
}

export interface GeneratorHit {
  ok: true;
  recipe: DrinkRecipe;
  substitutions: Substitution[];
}

export type MissReason = 'filters' | 'nearly' | 'empty';

export interface GeneratorMiss {
  ok: false;
  reason: MissReason;
  /** Ingredients that would unlock the most drinks, best first. */
  suggestions: { name: string; unlocks: number }[];
  /** How many drinks match if the active filters are cleared. */
  matchesWithoutFilters: number;
}

export type GeneratorResult = GeneratorHit | GeneratorMiss;
