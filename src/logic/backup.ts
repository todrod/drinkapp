import { CATEGORIES, LEVELS, type DrinkRecipe, type InventoryItem, type ProfileData, type RecipeIngredient, type ShoppingItem } from '../types';
import { isAlcoholFree } from './recipes';
import { MAX_MENU, validServings } from './hosting';
import { profileName } from './localProfiles';

export const MAX_BACKUP_BYTES = 4 * 1024 * 1024;
export function backupByteLength(text: string): number {
  let bytes = 0;
  for (const char of text) { const point = char.codePointAt(0)!; bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4; }
  return bytes;
}
export interface ParsedBackup { name: string; exportedAt: number; data: ProfileData }
const methods = ['shake', 'stir', 'build', 'blend', 'muddle'];
const origins = ['user', 'seed', 'generated', 'trending'];
const units = ['oz', 'ml', 'dash', 'splash', 'part', 'piece', 'tsp', 'top'];
const roles = ['base', 'modifier', 'mixer', 'sweetener', 'garnish', 'ice'];
type Obj = Record<string, unknown>;
const fail = (field: string): never => { throw new Error(`This backup has an invalid ${field}. Your existing bars have not changed.`); };
function obj(v: unknown, field: string): Obj { return v && typeof v === 'object' && !Array.isArray(v) ? v as Obj : fail(field); }
function str(v: unknown, field: string, max = 120, empty = false): string { return typeof v === 'string' && v.length <= max && (empty || !!v.trim()) ? v : fail(field); }
function nullableText(v: unknown, field: string, max = 120): string | null { return v === null ? null : str(v, field, max, true); }
function bool(v: unknown, field: string): boolean { return typeof v === 'boolean' ? v : fail(field); }
function num(v: unknown, field: string, max = 8640000000000000): number { return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max ? v : fail(field); }
function choice<T>(v: unknown, values: readonly T[], field: string): T { return values.includes(v as T) ? v as T : fail(field); }
function list<T>(v: unknown, field: string, max: number, parse: (v: unknown) => T): T[] { return Array.isArray(v) && v.length <= max ? v.map(parse) : fail(field); }
function unique<T extends { id: string }>(values: T[], field: string): T[] { if (new Set(values.map((v) => v.id)).size !== values.length) fail(field); return values; }

function ingredient(value: unknown): RecipeIngredient {
  const i = obj(value, 'recipe ingredient');
  const amount = i.amount === null ? null : num(i.amount, 'ingredient amount', 100000);
  if (amount === 0) fail('ingredient amount');
  const alcohol = i.alcohol === undefined ? undefined : choice(i.alcohol, ['none', 'contains', 'unknown'] as const, 'alcohol declaration');
  return { catalogItemId: nullableText(i.catalogItemId, 'ingredient ID'), displayName: str(i.displayName, 'ingredient name'), amount,
    unit: choice(i.unit, units, 'ingredient unit') as RecipeIngredient['unit'], role: choice(i.role, roles, 'ingredient role') as RecipeIngredient['role'], isOptional: bool(i.isOptional, 'optional ingredient flag'), ...(alcohol ? { alcohol } : {}) };
}

function recipe(value: unknown): DrinkRecipe {
  const r = obj(value, 'recipe');
  const rating = r.rating === null || r.rating === undefined ? null : num(r.rating, 'recipe rating', 5);
  const timesMade = num(r.timesMade, 'preparation history', 1000000);
  if ((rating !== null && (!Number.isInteger(rating) || rating < 1)) || !Number.isInteger(timesMade)) fail('recipe history');
  const accent = str(r.accent, 'recipe color', 9);
  if (!/^#(?:[a-f\d]{3}|[a-f\d]{6}|[a-f\d]{8})$/i.test(accent)) fail('recipe color');
  const result: DrinkRecipe = {
    id: str(r.id, 'recipe ID'), name: str(r.name, 'recipe name'), origin: choice(r.origin, origins, 'recipe origin') as DrinkRecipe['origin'],
    method: choice(r.method, methods, 'mixing method') as DrinkRecipe['method'], glass: nullableText(r.glass, 'glass'),
    ingredients: list(r.ingredients, 'ingredient list', 64, ingredient), steps: list(r.steps, 'mixing steps', 64, (s) => str(s, 'mixing step', 2000)),
    garnish: nullableText(r.garnish, 'garnish', 500), vibeTags: list(r.vibeTags, 'recipe tags', 40, (s) => str(s, 'recipe tag', 80)), accent,
    isZeroProof: false, timesMade, lastMadeAt: r.lastMadeAt === null ? null : num(r.lastMadeAt, 'last made time'),
    isFavorite: bool(r.isFavorite, 'favorite flag'), rating, sourceUrl: nullableText(r.sourceUrl, 'source URL', 2000),
    sourceNote: r.sourceNote === undefined ? null : nullableText(r.sourceNote, 'source note', 2000),
    theme: r.theme === undefined ? null : nullableText(r.theme, 'theme'), createdAt: num(r.createdAt, 'recipe creation time'),
  };
  if (result.sourceUrl) {
    try { if (!['https:', 'http:'].includes(new URL(result.sourceUrl).protocol)) fail('source URL'); } catch { fail('source URL'); }
  }
  result.isZeroProof = isAlcoholFree(result);
  return result;
}

function inventory(value: unknown): InventoryItem {
  const k = obj(value, 'inventory item');
  return { id: str(k.id, 'inventory ID'), catalogItemId: nullableText(k.catalogItemId, 'catalog ID'), name: str(k.name, 'inventory name'),
    category: choice(k.category, CATEGORIES, 'inventory category'), brand: nullableText(k.brand, 'brand'), level: choice(k.level, LEVELS, 'stock level'),
    isStaple: bool(k.isStaple, 'staple flag'), icon: str(k.icon, 'inventory icon', 64, true), addedAt: num(k.addedAt, 'added time'), updatedAt: num(k.updatedAt, 'updated time') };
}
function shopping(value: unknown): ShoppingItem {
  const s = obj(value, 'shopping item');
  return { id: str(s.id, 'shopping ID'), catalogItemId: nullableText(s.catalogItemId, 'shopping catalog ID'), name: str(s.name, 'shopping name'), done: bool(s.done, 'shopping completion flag'), addedAt: num(s.addedAt, 'shopping added time') };
}

/** Validation precedes every storage mutation. Restore always creates a new bar. */
export function parseBackup(text: string): ParsedBackup {
  if (text.length > MAX_BACKUP_BYTES || backupByteLength(text) > MAX_BACKUP_BYTES) throw new Error('Choose a Drink Shaker backup smaller than 4 MB.');
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new Error('That file is not a readable JSON backup. Your existing bars have not changed.'); }
  const root = obj(raw, 'backup file');
  if (root.format !== 'drink-shaker-local-bar' || root.version !== 1) throw new Error('Choose a supported Drink Shaker local bar backup (version 1).');
  const profile = obj(root.profile, 'bar name');
  const name = profileName(str(profile.name, 'bar name', 60));
  const d = obj(root.data, 'backup data'); const prefs = obj(d.prefs, 'preferences'); const p = obj(d.party, 'party plan');
  const entries = list(p.entries, 'party menu', MAX_MENU, (v) => { const e = obj(v, 'party entry'); if (!validServings(e.servings)) fail('party serving count'); return { recipeId: str(e.recipeId, 'party recipe ID'), servings: e.servings as number }; });
  if (new Set(entries.map((e) => e.recipeId)).size !== entries.length) fail('party menu');
  return { name, exportedAt: num(root.exportedAt, 'backup date'), data: {
    kit: unique(list(d.kit, 'inventory', 3000, inventory), 'duplicate inventory ID'),
    recipes: unique(list(d.recipes, 'recipe book', 3000, recipe), 'duplicate recipe ID'),
    shopping: unique(list(d.shopping, 'shopping list', 3000, shopping), 'duplicate shopping ID'),
    prefs: { ageGateAcceptedAt: null, zeroProofMode: bool(prefs.zeroProofMode, 'zero-proof preference'), allowSubstitutes: bool(prefs.allowSubstitutes, 'substitution preference'), shakeToShake: bool(prefs.shakeToShake, 'shake preference') },
    party: { title: str(p.title, 'party title', 80, true), unit: choice(p.unit, ['oz', 'ml'] as const, 'party units'), entries },
  } };
}

export function makeBackup(name: string, data: ProfileData): string {
  const { ageGateAcceptedAt: _, ...prefs } = data.prefs;
  const text = JSON.stringify({ format: 'drink-shaker-local-bar', version: 1, exportedAt: Date.now(), profile: { name: profileName(name) }, data: { ...data, prefs } }, null, 2);
  // Never offer a backup that the app cannot read back.
  parseBackup(text);
  return text;
}

export function backupFilename(name: string): string {
  const slug = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'my-bar';
  return `drink-shaker-${slug}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
}
