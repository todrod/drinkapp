const test = require('node:test');
const assert = require('node:assert/strict');
const { SEED_RECIPES } = require('../src/data/recipes.ts');
const { CATALOG } = require('../src/data/catalog.ts');
const { blankRecipe, alcoholStatus, isAlcoholFree, isServingReady, recipeIssues } = require('../src/logic/recipes.ts');
const { batchRecipe, menuTotals, validServings, normalizeParty, isCarbonated } = require('../src/logic/hosting.ts');
const { encodeGuestMenu, decodeGuestMenu, menuLink, tokenFromUrl } = require('../src/logic/guestMenu.ts');
const { buildOwned, generate, matchRecipe, countMakeable } = require('../src/logic/generator.ts');
const { discoverDrinks } = require('../src/logic/discovery.ts');
const { inCollection } = require('../src/data/curation.ts');
const { formatIngredient } = require('../src/format.ts');
const { decompressMenu } = require('../src/logic/menuCompression.ts');
const { compressToEncodedURIComponent } = require('lz-string');
const named = (name) => SEED_RECIPES.find((r) => r.name === name);
const kitFor = (ids) => CATALOG.filter((c) => ids.includes(c.id)).map((c) => ({ id: c.id, catalogItemId: c.id, name: c.name, level: 'full', category: c.category }));
const fullKit = kitFor(CATALOG.map((c) => c.id));
const ingredient = (patch = {}) => ({ catalogItemId: null, displayName: 'Homemade rum', amount: 2, unit: 'oz', role: 'base', isOptional: false, ...patch });
const custom = (patch = {}) => ({ ...blankRecipe(), name: 'My custom drink', ingredients: [ingredient()], steps: ['Build over ice.'], ...patch });

test('unknown free text fails closed across classification, collections, discovery and generation, including legacy flags', () => {
  const r = custom({ isZeroProof: true });
  assert.equal(alcoholStatus(r), 'unknown');
  assert.equal(inCollection(r, 'zero-proof'), false);
  assert.equal(discoverDrinks([r], 'mocktail').matches.length, 0);
  const kit = [{ id: 'custom', name: 'Homemade rum', catalogItemId: null, level: 'full' }];
  assert.equal(generate({ recipes: [r], kit, zeroProofMode: true, allowSubstitutes: true, vibes: [] }).ok, false);
  assert.equal(isAlcoholFree(custom({ ingredients: [ingredient({ alcohol: 'none' })] })), true);
  assert.equal(alcoholStatus(custom({ ingredients: [ingredient({ catalogItemId: 'sp-gin', alcohol: 'none' })] })), 'contains');
  assert.equal(alcoholStatus(blankRecipe()), 'unknown');
});

test('alcoholic substitutions cannot turn an alcohol-free recipe into an alcoholic suggestion', () => {
  const r = custom({ ingredients: [ingredient({ catalogItemId: 'sw-orgeat', displayName: 'Orgeat' })] });
  const kit = kitFor(['lq-amaretto']);
  assert.equal(isAlcoholFree(r), true);
  assert.equal(matchRecipe(r, buildOwned(kit), true).ok, false);
  assert.equal(generate({ recipes: [r], kit, zeroProofMode: true, allowSubstitutes: true, vibes: [] }).ok, false);
});

test('drafts need real measures and steps; all 144 bundled recipes remain usable', () => {
  assert.equal(isServingReady(custom({ ingredients: [ingredient({ amount: null })] })), false);
  assert.equal(matchRecipe(custom({ ingredients: [ingredient({ amount: null })] }), buildOwned([{ name: 'Homemade rum', level: 'full' }]), true).ok, false);
  assert.equal(isServingReady(custom({ ingredients: [ingredient({ amount: -2 })] })), false);
  assert.equal(isServingReady(custom({ ingredients: [ingredient({ amount: 0 })] })), false);
  assert.equal(isServingReady(custom({ ingredients: [ingredient({ amount: Infinity })] })), false);
  assert.equal(isServingReady(custom({ steps: ['Built in the Drink Builder — adjust the measures to taste.'] })), false);
  for (const r of SEED_RECIPES) assert.deepEqual(recipeIssues(r), [], r.name);
  assert.equal(formatIngredient(ingredient({ amount: null })), 'Homemade rum');
});

test('ready counters use the same alcohol-free restriction as the generator', () => {
  const zeroRecipes = SEED_RECIPES.filter(isAlcoholFree);
  assert.equal(countMakeable(SEED_RECIPES, fullKit, true, true), zeroRecipes.length);
  assert.ok(countMakeable(SEED_RECIPES, fullKit, true, true) < countMakeable(SEED_RECIPES, fullKit, true));
});

test('batch quantities convert US fluid ounces and teaspoons, without inventing dash volume', () => {
  const r = custom({ ingredients: [ingredient({ amount: 2, unit: 'oz' }), ingredient({ displayName: 'Syrup', amount: 1, unit: 'tsp' }), ingredient({ displayName: 'Bitters', amount: 2, unit: 'dash' })] });
  const lines = batchRecipe(r, 8, 'ml');
  assert.ok(Math.abs(lines[0].amount - 473.176473) < 0.00001);
  assert.ok(Math.abs(lines[1].amount - 39.43137275) < 0.00001);
  assert.equal(lines[2].amount, 16); assert.equal(lines[2].unit, 'dashes');
  assert.equal(batchRecipe(r, 8, 'oz')[0].amount, 16);
});

test('carbonation, ice, foam and garnish stay out of the premix; unknown top-up volumes stay per glass', () => {
  for (const name of ['Gin & Tonic', 'French 75', 'Virgin Mojito']) {
    const r = named(name); assert.ok(r, name);
    for (const ing of r.ingredients.filter(isCarbonated)) {
      assert.equal(batchRecipe(r, 8, 'ml').find((l) => l.name === ing.displayName).atServing, true);
    }
  }
  const r = custom({ ingredients: [ingredient(), ingredient({ displayName: 'Soda', amount: null, unit: 'top' }), ingredient({ displayName: 'Ice', amount: null, unit: 'piece', role: 'ice' })] });
  const lines = batchRecipe(r, 8, 'ml');
  assert.equal(lines[1].amount, null); assert.match(lines[1].perServing, /8 glasses/);
  assert.equal(lines[2].atServing, true);
});

test('combined totals merge measured ingredients across units and preserve optional distinctions', () => {
  const one = custom({ ingredients: [ingredient({ catalogItemId: 'sp-gin', displayName: 'Gin', amount: 1, unit: 'oz' })] });
  const two = custom({ ingredients: [ingredient({ catalogItemId: 'sp-gin', displayName: 'Other bottle of gin', amount: 30, unit: 'ml' })] });
  const before = JSON.stringify([one, two]);
  const totals = menuTotals([{ recipe: one, servings: 2 }, { recipe: two, servings: 2 }], 'ml');
  assert.equal(totals.length, 1); assert.ok(Math.abs(totals[0].amount - 119.147059125) < 0.000001);
  assert.equal(JSON.stringify([one, two]), before);
});

test('serving counts and saved menu data reject invalid values without losing valid entries', () => {
  for (const n of [0, -1, 1.5, 101, Infinity, NaN, '8', null]) assert.equal(validServings(n), false);
  assert.equal(validServings(1), true); assert.equal(validServings(100), true);
  assert.deepEqual(batchRecipe(named('Daiquiri'), 0, 'ml'), []);
  const party = normalizeParty({ title: 'A'.repeat(100), entries: [{ recipeId: 'r', servings: 8 }, { recipeId: 'r', servings: 9 }, { recipeId: 's', servings: -2 }], unit: 'wrong' });
  assert.equal(party.title.length, 80); assert.deepEqual(party.entries, [{ recipeId: 'r', servings: 8 }]); assert.equal(party.unit, 'ml');
});

test('guest snapshots roundtrip seed and edited/custom recipes without host state or history', () => {
  const seed = { ...named('Daiquiri'), isFavorite: true, rating: 5, timesMade: 23, lastMadeAt: 999 };
  const edited = { ...named('Virgin Mojito'), name: 'Our garden mojito', ingredients: [...named('Virgin Mojito').ingredients, ingredient({ alcohol: 'none', displayName: 'Herb infusion' })] };
  const token = encodeGuestMenu('Saturday ✨', [seed, edited]);
  const menu = decodeGuestMenu(token);
  assert.equal(menu.title, 'Saturday ✨'); assert.equal(menu.recipes.length, 2);
  assert.equal(menu.recipes[0].timesMade, 0); assert.equal(menu.recipes[0].isFavorite, false); assert.equal(menu.recipes[0].rating, null);
  assert.equal(menu.recipes[1].name, edited.name); assert.deepEqual(menu.recipes[1].ingredients, edited.ingredients.map((i) => ({ ...i, alcohol: i.alcohol ?? 'unknown' })));
  const link = menuLink('http://localhost:8085/', token);
  assert.equal(tokenFromUrl(link), token); assert.equal(tokenFromUrl('https://example.com/#other'), null);
  assert.throws(() => menuLink('javascript:alert(1)', token));
  assert.equal(decodeGuestMenu('invalid'), null); assert.equal(decodeGuestMenu('x'.repeat(10001)), null);
  assert.throws(() => encodeGuestMenu('Draft', [blankRecipe()]));
});

test('party plan web persistence preserves inventory and existing recipe edits', () => {
  const values = new Map();
  globalThis.localStorage = { getItem: (k) => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) };
  const store = require('../src/db/store.web.ts');
  const edited = { ...named('Daiquiri'), name: 'My saved Daiquiri', rating: 4 };
  store.saveRecipe(edited); store.saveKitItem(fullKit[0]);
  store.saveParty({ title: 'Saturday', entries: [{ recipeId: edited.id, servings: 8 }], unit: 'oz' });
  assert.equal(store.loadParty().entries[0].servings, 8);
  assert.equal(store.loadRecipes().find((r) => r.id === edited.id).name, edited.name);
  assert.equal(store.loadKit().length, 1);
  delete globalThis.localStorage;
});

test('guest link decoding bounds expansion and handles Unicode without losing data', () => {
  for (const text of ['plain text', 'Café ✨ 🍸', 'a'.repeat(10000), JSON.stringify(SEED_RECIPES.slice(0, 6))]) {
    assert.equal(decompressMenu(compressToEncodedURIComponent(text)), text);
  }
  assert.equal(decompressMenu(compressToEncodedURIComponent('a'.repeat(60000))), null);
  assert.equal(decompressMenu('not_valid'), null);
});

test('native SQLite v4-to-v5 migration preserves bottles and edited recipes and persists the party', () => {
  const { DatabaseSync } = require('node:sqlite');
  const Module = require('node:module');
  const db = new DatabaseSync(':memory:');
  const nativeAdapter = {
    execSync: (sql) => db.exec(sql),
    runSync: (sql, values = []) => db.prepare(sql).run(...values),
    getAllSync: (sql, values = []) => db.prepare(sql).all(...values),
    getFirstSync: (sql, values = []) => db.prepare(sql).get(...values),
  };
  const originalLoad = Module._load;
  const path = require.resolve('../src/db/store.ts');
  Module._load = function (request, ...args) {
    return request === 'expo-sqlite' ? { openDatabaseSync: () => nativeAdapter } : originalLoad.call(this, request, ...args);
  };
  try {
    delete require.cache[path];
    let native = require(path);
    const bottle = { id: 'one-gin', catalogItemId: 'sp-gin', name: 'My gin', category: 'beverage', brand: null, level: 'low', isStaple: false, icon: '', addedAt: 10, updatedAt: 20 };
    native.saveKitItem(bottle);
    native.saveRecipe({ ...named('Daiquiri'), name: 'My existing edit', rating: 5 });
    db.exec('DROP TABLE app_state; PRAGMA user_version = 4');
    delete require.cache[path];
    native = require(path);
    const party = { title: 'Saturday', entries: [{ recipeId: named('Daiquiri').id, servings: 12 }], unit: 'ml' };
    native.saveParty(party);
    assert.deepEqual(native.loadParty(), party);
    assert.equal(db.prepare('PRAGMA user_version').get().user_version, 5);
    assert.equal(native.loadKit()[0].level, 'low');
    assert.equal(native.loadRecipes().find((r) => r.id === named('Daiquiri').id).name, 'My existing edit');
    assert.equal(native.loadRecipes().find((r) => r.id === named('Daiquiri').id).rating, 5);
  } finally {
    Module._load = originalLoad; delete require.cache[path]; db.close();
  }
});
