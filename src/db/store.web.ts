import type { DrinkRecipe, InventoryItem, PartyPlan, Prefs, ProfileData, ProfileIndex, ShoppingItem } from '../types';
import { normalizeParty } from '../logic/hosting';
import { newLocalProfile, profileIdIsValid, readProfileIndex, renameLocalProfile } from '../logic/localProfiles';
import { reportPersistenceError } from '../persistenceStatus';
import { SEED_RECIPES } from '../data/recipes';
import { bindProfileStore } from './profileStore';

// Metro selects this adapter on web; no native SQLite enters the web bundle.
// Original keys remain readable. New bars use one atomic JSON record each.
function keyFor(key: string, id: string) {
  if (!profileIdIsValid(id)) throw new Error('Invalid local bar identifier.');
  return id === 'default' ? 'shaker:' + key : `shaker:profile:${id}:${key}`;
}
function read<T>(key: keyof ProfileData, fallback: T, id = 'default'): T {
  try {
    const state = globalThis.localStorage.getItem(keyFor('state', id));
    if (state !== null) return (JSON.parse(state) as Record<string, T>)[key] ?? fallback;
    const raw = globalThis.localStorage.getItem(keyFor(key, id));
    return raw === null ? fallback : JSON.parse(raw) as T;
  } catch { reportPersistenceError('read'); throw new Error('This device could not read its saved bar. Existing data has been kept.'); }
}
function write(key: keyof ProfileData, value: unknown, id = 'default') {
  try {
    const state = globalThis.localStorage.getItem(keyFor('state', id));
    if (state !== null) globalThis.localStorage.setItem(keyFor('state', id), JSON.stringify({ ...JSON.parse(state), [key]: value }));
    else globalThis.localStorage.setItem(keyFor(key, id), JSON.stringify(value));
  } catch { reportPersistenceError(); }
}

export function loadKit(id = 'default'): InventoryItem[] { return read('kit', [], id); }
export function replaceKit(items: InventoryItem[], id = 'default') {
  try {
    const state = globalThis.localStorage.getItem(keyFor('state', id));
    if (state !== null) globalThis.localStorage.setItem(keyFor('state', id), JSON.stringify({ ...JSON.parse(state), kit: items }));
    else globalThis.localStorage.setItem(keyFor('kit', id), JSON.stringify(items));
  } catch { reportPersistenceError(); throw new Error('Inventory could not be saved. Your saved inventory has been kept. Check device storage and try again.'); }
}
export function saveKitItem(item: InventoryItem, id = 'default') {
  const kit = loadKit(id); const at = kit.findIndex((k) => k.id === item.id);
  if (at >= 0) kit[at] = item; else kit.unshift(item);
  write('kit', kit, id);
}
export function deleteKitItem(itemId: string, id = 'default') { write('kit', loadKit(id).filter((k) => k.id !== itemId), id); }

/** New seeds merge per bar without changing its edits, ratings or history. */
export function loadRecipes(id = 'default'): DrinkRecipe[] {
  const stored = read<DrinkRecipe[]>('recipes', [], id);
  const known = new Set(stored.map((r) => r.id));
  const missing = SEED_RECIPES.filter((r) => !known.has(r.id));
  if (!missing.length) return stored;
  const merged = [...missing, ...stored]; write('recipes', merged, id); return merged;
}
export function saveRecipe(recipe: DrinkRecipe, id = 'default') {
  const all = read<DrinkRecipe[]>('recipes', [], id); const at = all.findIndex((r) => r.id === recipe.id);
  if (at >= 0) all[at] = recipe; else all.unshift(recipe);
  write('recipes', all, id);
}
export function deleteRecipe(recipeId: string, id = 'default') { write('recipes', read<DrinkRecipe[]>('recipes', [], id).filter((r) => r.id !== recipeId), id); }
export function loadShopping(id = 'default'): ShoppingItem[] { return read('shopping', [], id); }
export function saveShoppingItem(item: ShoppingItem, id = 'default') {
  const all = loadShopping(id); const at = all.findIndex((s) => s.id === item.id);
  if (at >= 0) all[at] = item; else all.push(item);
  write('shopping', all, id);
}
export function deleteShoppingItem(itemId: string, id = 'default') { write('shopping', loadShopping(id).filter((s) => s.id !== itemId), id); }
export const DEFAULT_PREFS: Prefs = { ageGateAcceptedAt: null, zeroProofMode: false, allowSubstitutes: true, shakeToShake: true };
export function loadPrefs(id = 'default'): Prefs { return { ...DEFAULT_PREFS, ...read<Partial<Prefs>>('prefs', {}, id) }; }
export function savePrefs(prefs: Prefs, id = 'default') { write('prefs', prefs, id); }
export function loadParty(id = 'default'): PartyPlan { return normalizeParty(read('party', null, id)); }
export function saveParty(party: PartyPlan, id = 'default') { write('party', normalizeParty(party), id); }

export function loadProfileIndex(): ProfileIndex {
  try { const raw = globalThis.localStorage.getItem('shaker:local-profiles:v1'); return readProfileIndex(raw === null ? null : JSON.parse(raw)); }
  catch { reportPersistenceError('read'); throw new Error('The local bar list could not be read. Your existing bar files have been kept.'); }
}
function saveIndex(index: ProfileIndex) {
  try { globalThis.localStorage.setItem('shaker:local-profiles:v1', JSON.stringify(readProfileIndex(index))); }
  catch { reportPersistenceError(); throw new Error('Device storage is unavailable. Your current local bar has been kept.'); }
}
export function setActiveProfile(id: string): ProfileIndex {
  const index = loadProfileIndex();
  if (!index.profiles.some((p) => p.id === id)) throw new Error('That local bar could not be found.');
  const next = { ...index, activeId: id }; saveIndex(next); return next;
}
export function renameProfile(id: string, name: string): ProfileIndex {
  const next = renameLocalProfile(loadProfileIndex(), id, name); saveIndex(next); return next;
}
export function replaceProfileData(data: ProfileData, id = 'default') {
  try { globalThis.localStorage.setItem(keyFor('state', id), JSON.stringify(data)); }
  catch { reportPersistenceError(); throw new Error('Device storage is full or unavailable. No local bar was restored or overwritten.'); }
}
export function createProfile(name: string, data: ProfileData): ProfileIndex {
  const index = loadProfileIndex(); const profile = newLocalProfile(name, index);
  replaceProfileData(data, profile.id);
  // Publish last. An interrupted or failed import cannot displace a saved bar.
  const next: ProfileIndex = { ...index, activeId: profile.id, profiles: [...index.profiles, profile] };
  saveIndex(next); return next;
}
export const scopedToProfile = (id: string) => bindProfileStore({ loadKit, replaceKit, saveKitItem, deleteKitItem, loadRecipes, saveRecipe, deleteRecipe, loadShopping, saveShoppingItem, deleteShoppingItem, loadPrefs, savePrefs, loadParty, saveParty, replaceProfileData }, id);
