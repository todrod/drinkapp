import { CATEGORIES, LEVELS, type Category, type Level } from '../types';
import { CATALOG_BY_ID } from '../data/catalog';
import { backupByteLength } from './backup';
import { inventoryNameKey, matchInventoryName, validateInventoryDraft, type InventoryDraft } from './inventory';

export const MAX_INVENTORY_FILE_BYTES = 1024 * 1024;
export const MAX_IMPORT_ITEMS = 500;
export type InventoryPreview = { rows: InventoryDraft[]; issues: string[]; duplicateCount: number };
const headerKey = (value: string) => inventoryNameKey(value).replace(/ /g, '');
const nameHeaders = ['name', 'item', 'itemname', 'ingredient', 'ingredientname', 'bottle', 'bottlename'];
const categoryAliases: Record<string, Category> = { spirit: 'beverage', spirits: 'beverage', liquor: 'beverage', liqueur: 'beverage', wine: 'beverage', beer: 'beverage', syrup: 'sweet', sweetener: 'sweet', bitters: 'flavor', glasses: 'glass', tools: 'tool', mixers: 'mixer' };
function categoryFor(value: string): Category | null {
  const key = inventoryNameKey(value);
  return CATEGORIES.includes(key as Category) ? key as Category : Object.hasOwn(categoryAliases, key) ? categoryAliases[key] : null;
}
function levelFor(value: string): Level | null {
  const key = inventoryNameKey(value);
  return LEVELS.includes(key as Level) ? key as Level : ({ empty: 'out', 'out of stock': 'out', 'running low': 'low', 'half full': 'half' } as Record<string, Level>)[key] ?? null;
}

// A small RFC-style reader keeps quoted commas/newlines and doubled quotes intact.
function delimited(text: string, separator: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let value = ''; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i++; }
      else if (quoted || !value.trim()) quoted = !quoted;
      else value += c;
    } else if (!quoted && (c === separator || c === '\n')) {
      row.push(value.trim()); value = '';
      if (c === '\n') { if (row.some(Boolean)) rows.push(row); row = []; }
    } else value += c;
  }
  if (quoted) throw new Error('A quoted CSV field is missing its closing quote.');
  row.push(value.trim()); if (row.some(Boolean)) rows.push(row);
  return rows;
}
type Raw = Record<string, unknown>;
export function parseInventoryList(source: string): InventoryPreview {
  if (backupByteLength(source) > MAX_INVENTORY_FILE_BYTES) throw new Error('Choose a list smaller than 1 MB.');
  const text = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
  if (!text) throw new Error('Choose a file or paste at least one inventory item.');
  const issues: string[] = []; let raw: unknown[];
  if (text.startsWith('[') || text.startsWith('{')) {
    let data: unknown;
    try { data = JSON.parse(text); } catch { throw new Error('This JSON list could not be read. Check its formatting.'); }
    if (Array.isArray(data)) raw = data;
    else if (data && typeof data === 'object') {
      const object = data as Raw; const nested = object.data && typeof object.data === 'object' ? object.data as Raw : {};
      const list = object.inventory ?? object.kit ?? nested.kit;
      if (!Array.isArray(list)) throw new Error('Use a JSON array, an inventory/kit list, or a Shaker backup.');
      raw = list;
    } else throw new Error('This file does not contain an inventory list.');
  } else {
    const firstLine = text.split('\n')[0];
    const separator = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';
    const rows = delimited(text, separator);
    const headers = rows[0]?.map(headerKey) ?? [];
    const nameIndex = headers.findIndex((header) => nameHeaders.includes(header));
    if (nameIndex >= 0) {
      raw = rows.slice(1).map((cells) => Object.fromEntries(headers.map((key, i) => [nameHeaders.includes(key) ? 'name' : key, cells[i] ?? ''])));
    } else {
      raw = rows.flatMap((cells) => {
        if (cells.length > 1 && (categoryFor(cells[1]) || levelFor(cells[1]))) return [{ name: cells[0], category: categoryFor(cells[1]) ? cells[1] : '', level: levelFor(cells[1]) ? cells[1] : cells[2] ?? '' }];
        return cells.map((name) => ({ name }));
      });
    }
  }
  if (raw.length > MAX_IMPORT_ITEMS) throw new Error('Import up to 500 items at a time. Split this list into smaller files.');
  const rows: InventoryDraft[] = []; const seen = new Set<string>(); let duplicateCount = 0;
  raw.forEach((entry, index) => {
    const label = `Row ${index + 1}`;
    const value: Raw = typeof entry === 'string' ? { name: entry } : entry && typeof entry === 'object' && !Array.isArray(entry) ? entry as Raw : {};
    const sourceName = value.name ?? value.item ?? value.ingredient;
    if (typeof sourceName !== 'string' || !sourceName.trim()) { issues.push(`${label}: skipped a missing or invalid item name.`); return; }
    const name = sourceName.replace(/^\s*(?:[-*•–]\s+|\d+[.)]\s+)/, '').replace(/\s+/g, ' ').trim();
    const key = inventoryNameKey(name);
    if (seen.has(key)) { duplicateCount++; return; }
    const link = value.catalogItemId ?? value.catalogitemid ?? value.catalogid ?? value.catalog;
    let catalogId = typeof link === 'string' && link.trim() ? CATALOG_BY_ID[link.trim()]?.id ?? matchInventoryName(link) : matchInventoryName(name);
    if (link && !catalogId) issues.push(`${label}: unknown recipe type; review ${name} as a custom item.`);
    const catalog = catalogId ? CATALOG_BY_ID[catalogId] : null;
    const rawCategory = value.category ?? value.type;
    const category = typeof rawCategory === 'string' && rawCategory.trim() ? categoryFor(rawCategory) : null;
    if (rawCategory !== undefined && rawCategory !== null && rawCategory !== '' && !category) issues.push(`${label}: unknown category; review the category for ${name}.`);
    const rawLevel = value.level ?? value.stock ?? value.stocklevel;
    const level = typeof rawLevel === 'string' ? levelFor(rawLevel) : null;
    if (rawLevel !== undefined && rawLevel !== null && rawLevel !== '' && !level) issues.push(`${label}: unknown stock level; ${name} defaults to Full.`);
    try {
      const draft = validateInventoryDraft({ name, catalogItemId: catalogId, category: catalog?.category ?? category ?? 'beverage', brand: typeof value.brand === 'string' ? value.brand : null, level: level ?? 'full' });
      rows.push(draft); seen.add(key);
    } catch (error) { issues.push(`${label}: ${error instanceof Error ? error.message : 'Invalid item.'}`); }
  });
  if (!rows.length) throw new Error(issues[0] ?? 'No inventory items were found in this list.');
  return { rows, issues, duplicateCount };
}
