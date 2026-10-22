const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseInventoryList, MAX_IMPORT_ITEMS, MAX_INVENTORY_FILE_BYTES } = require('../src/logic/inventoryImport.ts');
const { inventoryNameKey, matchInventoryName, newInventoryItem, mergeInventory, editInventory, removeInventory, restoreInventory } = require('../src/logic/inventory.ts');
const { generate } = require('../src/logic/generator.ts');
const { SEED_RECIPES } = require('../src/data/recipes.ts');
const { MY_BAR } = require('../src/data/bar.ts');
const { CATALOG_BY_ID } = require('../src/data/catalog.ts');
const draft = (name, extra = {}) => ({ name, catalogItemId: matchInventoryName(name), category: 'beverage', level: 'full', brand: null, ...extra });
let serial = 0; const uid = () => 'import-' + ++serial;

test('pasted bullets, numbered lists, CRLF/BOM and comma-separated names match known types without AI', () => {
  const preview = parseInventoryList('\uFEFF• Gin\r\n2. Lime juice\r\n- Simple syrup\r\nGin');
  assert.equal(preview.rows.length, 3); assert.equal(preview.duplicateCount, 1);
  assert.deepEqual(preview.rows.map((r) => r.catalogItemId), ['sp-gin', 'mx-lime-juice', 'sw-simple']);
  assert.equal(parseInventoryList('Gin,Vodka,Lime juice').rows.length, 3);
});

test('CSV/TSV/semicolon headers handle reordered fields, quoted commas, quotes and line breaks', () => {
  const csv = 'Brand,Name,Level,Category\n"House, Ltd","House ""Reserve"" Gin",half,spirits\n,Fresh lime juice,low,mixer';
  const rows = parseInventoryList(csv).rows;
  assert.equal(rows[0].name, 'House "Reserve" Gin'); assert.equal(rows[0].brand, 'House, Ltd'); assert.equal(rows[0].level, 'half');
  assert.equal(rows[1].catalogItemId, 'mx-lime-juice');
  assert.equal(parseInventoryList('Item\tStock\tType\nGin\tempty\tspirits').rows[0].level, 'out');
  assert.equal(parseInventoryList('Name;Level\nVodka;half').rows[0].level, 'half');
  assert.equal(parseInventoryList('Name,Brand\n"House\nBottle",Local').rows[0].name, 'House Bottle');
});

test('JSON arrays, inventory wrappers and backup kit lists import inventory fields only', () => {
  for (const text of ['["Gin", "Lime juice"]', '{"inventory":[{"name":"Gin","level":"low"}]}', '{"kit":[{"name":"Gin"}]}', '{"data":{"kit":[{"name":"Gin","id":"stolen","isStaple":true}]},"recipes":["ignored"]}']) {
    const result = parseInventoryList(text);
    assert.equal(result.rows[0].name, 'Gin'); assert.ok(!('id' in result.rows[0])); assert.ok(!('isStaple' in result.rows[0]));
  }
});

test('only explicit known names/brands match; unknown and alcohol-free lookalikes remain custom', () => {
  for (const [name, id] of MY_BAR) assert.equal(matchInventoryName(name), id);
  const result = parseInventoryList('My secret infusion\nAlcohol-free gin\nGin');
  assert.equal(result.rows[0].catalogItemId, null); assert.equal(result.rows[1].catalogItemId, null); assert.equal(result.rows[2].catalogItemId, 'sp-gin');
  assert.equal(matchInventoryName('club soda'), 'mx-soda');
});

test('bad rows and unknown fields generate review warnings without silently turning into valid types', () => {
  const result = parseInventoryList(JSON.stringify([{ name: 'My bottle', catalogItemId: 'bad-id', category: 'nonsense', level: 'plenty' }, { name: '' }, { name: 42 }, { name: 'x'.repeat(121) }]));
  assert.equal(result.rows.length, 1); assert.equal(result.rows[0].catalogItemId, null); assert.equal(result.rows[0].level, 'full');
  assert.equal(result.issues.length, 6);
});

test('invalid JSON, broken quotes, empty or oversized lists fail before any inventory change', () => {
  for (const text of ['', '   ', '[]', '{}', '{broken', 'Name\n"unfinished', 'x'.repeat(MAX_INVENTORY_FILE_BYTES + 1), Array.from({ length: MAX_IMPORT_ITEMS + 1 }, (_, n) => 'Bottle ' + n).join('\n')]) assert.throws(() => parseInventoryList(text));
});

test('name deduplication preserves non-Latin identities and ignores accents/case/punctuation', () => {
  assert.equal(inventoryNameKey('  HENDRICK’S gin '), inventoryNameKey("Hendrick's Gin"));
  assert.notEqual(inventoryNameKey('日本 1'), inventoryNameKey('русский 1'));
  assert.equal(parseInventoryList('日本酒\n烧酒\nGin\ngin').rows.length, 3);
});

test('merging skips existing names without changing levels and keeps separate bottles sharing a type', () => {
  const existing = newInventoryItem(draft('Gin', { level: 'low' }), 'old', 1);
  const result = mergeInventory([existing], [draft(' gin '), draft('Tanqueray Gin'), draft('Monkey 47 Schwarzwald Dry Gin')], uid, 20);
  assert.equal(result.added, 2); assert.equal(result.skipped, 1); assert.equal(result.kit.at(-1), existing);
  assert.equal(existing.level, 'low'); assert.equal(result.kit.filter((item) => item.catalogItemId === 'sp-gin').length, 3);
  assert.equal(result.kit[0].addedAt, 20); assert.equal(new Set(result.kit.map((r) => r.id)).size, 3);
});

test('merge validates every row, catalog link and maximum before returning a change', () => {
  const current = [newInventoryItem(draft('Gin'), 'old', 1)];
  assert.throws(() => mergeInventory(current, [draft('Vodka'), draft('')], uid)); assert.equal(current.length, 1);
  assert.throws(() => mergeInventory([], [draft('Mystery', { catalogItemId: 'bogus' })], uid));
  assert.throws(() => mergeInventory(current, [draft('Vodka')], () => 'old'));
  assert.throws(() => mergeInventory(Array.from({ length: 1000 }, (_, n) => ({ ...current[0], id: 'i' + n, name: 'item ' + n })), [draft('Vodka')], uid));
});

test('manual edits retain row identity/creation time while updating matching, stock, brand and art', () => {
  const original = newInventoryItem(draft('Gin'), 'one', 10);
  const next = editInventory([original], 'one', draft('My lime', { catalogItemId: 'mx-lime-juice', category: 'glass', level: 'out', brand: ' Local ' }), 30)[0];
  assert.equal(next.id, 'one'); assert.equal(next.addedAt, 10); assert.equal(next.updatedAt, 30);
  assert.equal(next.category, 'mixer'); assert.equal(next.catalogItemId, 'mx-lime-juice'); assert.equal(next.level, 'out'); assert.equal(next.brand, 'Local');
  assert.equal(next.icon, CATALOG_BY_ID['mx-lime-juice'].icon); assert.equal(original.name, 'Gin');
  assert.throws(() => editInventory([original, newInventoryItem(draft('Vodka'), 'two', 10)], 'one', draft('vodka')));
  assert.throws(() => editInventory([original], 'missing', draft('Gin')));
});

test('clearing a catalog link creates a custom item without retaining staple privileges', () => {
  const original = newInventoryItem(draft('Ice cubes'), 'ice', 1);
  const [custom] = editInventory([original], 'ice', draft('My special item', { catalogItemId: null, category: 'flavor' }));
  assert.equal(custom.catalogItemId, null); assert.equal(custom.isStaple, false); assert.equal(custom.category, 'flavor');
});

test('bulk removal/clear and undo preserve every original row and do not duplicate IDs', () => {
  const current = mergeInventory([], [draft('Gin'), draft('Lime juice'), draft('Simple syrup')], uid).kit;
  const result = removeInventory(current, [current[0].id, current[2].id, 'unknown']);
  assert.equal(result.kit.length, 1); assert.equal(result.removed.length, 2);
  const restored = restoreInventory(result.kit, result.removed);
  assert.deepEqual(new Set(restored.map((r) => r.id)), new Set(current.map((r) => r.id)));
  assert.equal(restoreInventory(restored, result.removed).length, 3);
  const cleared = removeInventory(current, current.map((r) => r.id));
  assert.deepEqual(cleared.kit, []); assert.deepEqual(restoreInventory([], cleared.removed), current);
});

test('imported catalog types unlock real recipes and edits/removals immediately change makeability', () => {
  const kit = mergeInventory([], parseInventoryList('White rum\nLime juice\nSimple syrup').rows, uid).kit;
  const daiquiri = SEED_RECIPES.filter((r) => r.name === 'Daiquiri');
  const result = (stock) => generate({ recipes: daiquiri, kit: stock, zeroProofMode: false, allowSubstitutes: false, vibes: [] });
  assert.equal(daiquiri.length, 1);
  assert.equal(result(kit).ok, true);
  const rum = kit.find((k) => k.catalogItemId === 'sp-rum-white');
  const out = editInventory(kit, rum.id, draft(rum.name, { catalogItemId: rum.catalogItemId, level: 'out' }));
  assert.equal(result(out).ok, false);
});
