import type { DrinkRecipe, InventoryItem, PartyPlan, Prefs, ProfileData, ShoppingItem } from '../types';
import { profileIdIsValid } from '../logic/localProfiles';
import { reportPersistenceError } from '../persistenceStatus';

export interface ProfileStore {
  loadKit(id?: string): InventoryItem[];
  saveKitItem(item: InventoryItem, id?: string): void;
  deleteKitItem(itemId: string, id?: string): void;
  loadRecipes(id?: string): DrinkRecipe[];
  saveRecipe(recipe: DrinkRecipe, id?: string): void;
  deleteRecipe(recipeId: string, id?: string): void;
  loadShopping(id?: string): ShoppingItem[];
  saveShoppingItem(item: ShoppingItem, id?: string): void;
  deleteShoppingItem(itemId: string, id?: string): void;
  loadPrefs(id?: string): Prefs;
  savePrefs(prefs: Prefs, id?: string): void;
  loadParty(id?: string): PartyPlan;
  saveParty(party: PartyPlan, id?: string): void;
  replaceProfileData(data: ProfileData, id?: string): void;
}

/** Captured per provider: an old queued update can only write its own bar. */
export function bindProfileStore(store: ProfileStore, id: string) {
  if (!profileIdIsValid(id)) throw new Error('Invalid local bar identifier.');
  const write = (action: () => void) => { try { action(); } catch { reportPersistenceError(); } };
  return {
    loadKit: () => store.loadKit(id), saveKitItem: (item: InventoryItem) => write(() => store.saveKitItem(item, id)), deleteKitItem: (itemId: string) => write(() => store.deleteKitItem(itemId, id)),
    loadRecipes: () => store.loadRecipes(id), saveRecipe: (recipe: DrinkRecipe) => write(() => store.saveRecipe(recipe, id)), deleteRecipe: (recipeId: string) => write(() => store.deleteRecipe(recipeId, id)),
    loadShopping: () => store.loadShopping(id), saveShoppingItem: (item: ShoppingItem) => write(() => store.saveShoppingItem(item, id)), deleteShoppingItem: (itemId: string) => write(() => store.deleteShoppingItem(itemId, id)),
    loadPrefs: () => store.loadPrefs(id), savePrefs: (prefs: Prefs) => write(() => store.savePrefs(prefs, id)), loadParty: () => store.loadParty(id), saveParty: (party: PartyPlan) => write(() => store.saveParty(party, id)),
    replaceProfileData: (data: ProfileData) => store.replaceProfileData(data, id),
  };
}
