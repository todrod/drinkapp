import { CATEGORIES, LEVELS, type Category, type InventoryItem, type Level } from '../types';
import { CATALOG, CATALOG_BY_ID } from '../data/catalog';
import { MY_BAR } from '../data/bar';

export type InventoryDraft = Pick<InventoryItem, 'name' | 'catalogItemId' | 'category' | 'brand' | 'level'>;
export const MAX_INVENTORY_ITEMS = 1000;
export function inventoryNameKey(name: string): string {
  return name.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[’']/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}
const aliases = new Map(CATALOG.map((item) => [inventoryNameKey(item.name), item.id]));
MY_BAR.forEach(([name, id]) => aliases.set(inventoryNameKey(name), id));
Object.entries({ 'club soda': 'mx-soda', 'simple syrup': 'sw-simple', 'fresh lime juice': 'mx-lime-juice', 'fresh lemon juice': 'mx-lemon-juice' }).forEach(([name, id]) => {
  if (CATALOG_BY_ID[id]) aliases.set(inventoryNameKey(name), id);
});
export function matchInventoryName(name: string): string | null { return aliases.get(inventoryNameKey(name)) ?? null; }

export function validateInventoryDraft(value: InventoryDraft): InventoryDraft {
  const name = value.name.trim();
  if (!name || name.length > 120 || !inventoryNameKey(name)) throw new Error('Use an item name of 1–120 letters or numbers.');
  if (!CATEGORIES.includes(value.category) || !LEVELS.includes(value.level)) throw new Error('Choose a category and stock level.');
  const catalog = value.catalogItemId && Object.hasOwn(CATALOG_BY_ID, value.catalogItemId) ? CATALOG_BY_ID[value.catalogItemId] : null;
  if (value.catalogItemId && !catalog) throw new Error('Choose a recipe type from the catalog, or use Custom item.');
  const brand = value.brand?.trim() || null;
  if (brand && brand.length > 120) throw new Error('Keep the brand under 120 characters.');
  return { name, brand, catalogItemId: catalog?.id ?? null, category: catalog?.category ?? value.category, level: value.level };
}
export function draftFor(item: InventoryItem): InventoryDraft {
  return { name: item.name, brand: item.brand, category: item.category, level: item.level, catalogItemId: item.catalogItemId };
}
export function newInventoryItem(draft: InventoryDraft, id: string, now: number): InventoryItem {
  const value = validateInventoryDraft(draft);
  const catalog = value.catalogItemId ? CATALOG_BY_ID[value.catalogItemId] : null;
  return { ...value, id, isStaple: catalog?.isStaple ?? false, icon: catalog?.icon ?? '🫙', addedAt: now, updatedAt: now };
}
export function mergeInventory(current: InventoryItem[], drafts: InventoryDraft[], uid: () => string, now = Date.now()) {
  const names = new Set(current.map((item) => inventoryNameKey(item.name)));
  const ids = new Set(current.map((item) => item.id));
  const added: InventoryItem[] = [];
  let skipped = 0;
  for (const raw of drafts) {
    const draft = validateInventoryDraft(raw); const key = inventoryNameKey(draft.name);
    if (names.has(key)) { skipped++; continue; }
    const id = uid();
    if (!id || ids.has(id)) throw new Error('Couldn’t create unique inventory items. Please try again.');
    ids.add(id); names.add(key); added.push(newInventoryItem(draft, id, now));
  }
  if (current.length + added.length > MAX_INVENTORY_ITEMS) throw new Error('Keep each local bar under 1,000 inventory items.');
  return { kit: [...added, ...current], added: added.length, skipped };
}
export function editInventory(current: InventoryItem[], id: string, draft: InventoryDraft, now = Date.now()): InventoryItem[] {
  const original = current.find((item) => item.id === id);
  if (!original) throw new Error('This item is no longer in your inventory.');
  const value = validateInventoryDraft(draft);
  if (current.some((item) => item.id !== id && inventoryNameKey(item.name) === inventoryNameKey(value.name))) throw new Error('Another item already has this name. Use a distinct bottle name.');
  const updated = { ...newInventoryItem(value, id, now), addedAt: original.addedAt };
  return current.map((item) => item.id === id ? updated : item);
}
export function removeInventory(current: InventoryItem[], ids: string[]) {
  const selected = new Set(ids);
  return { kit: current.filter((item) => !selected.has(item.id)), removed: current.filter((item) => selected.has(item.id)) };
}
export function restoreInventory(current: InventoryItem[], removed: InventoryItem[]) {
  const ids = new Set(current.map((item) => item.id));
  const restored = removed.filter((item) => { if (ids.has(item.id)) return false; ids.add(item.id); return true; });
  if (current.length + restored.length > MAX_INVENTORY_ITEMS) throw new Error('Remove a few items before undoing. A local bar holds up to 1,000 items.');
  return [...restored, ...current];
}
