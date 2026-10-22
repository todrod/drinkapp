const { test } = require('node:test');
const assert = require('node:assert/strict');
const { SEED_RECIPES } = require('../src/data/recipes.ts');
const { CATALOG_BY_ID } = require('../src/data/catalog.ts');
const { generate, resolveRandomSource, buildOwned, matchRecipe } = require('../src/logic/generator.ts');
const { discoverDrinks } = require('../src/logic/discovery.ts');
const { isAlcoholFree, isServingReady } = require('../src/logic/recipes.ts');
const { emptyProfileData } = require('../src/logic/localProfiles.ts');
const { makeBackup, parseBackup } = require('../src/logic/backup.ts');
const web = require('../src/db/store.web.ts');
const options = { recipes: SEED_RECIPES, kit: [], zeroProofMode: false, allowSubstitutes: true, vibes: [] };
const recipe = (name) => SEED_RECIPES.find((r) => r.name === name);
const bottle = (catalogItemId, level = 'full') => ({ id: catalogItemId, catalogItemId, name: CATALOG_BY_ID[catalogItemId].name, category: CATALOG_BY_ID[catalogItemId].category, level, brand: null, isStaple: false, icon: '', addedAt: 0, updatedAt: 0 });

test('all recipes works with no stock; omitted or inventory source keeps strict matching', () => {
  const d = recipe('Daiquiri'); const input = { ...options, recipes: [d] };
  assert.equal(generate(input).ok, false);
  assert.equal(generate({ ...input, source: 'inventory' }).ok, false);
  const before = JSON.stringify(input);
  const picked = generate({ ...input, source: 'all' });
  assert.equal(picked.ok, true); assert.equal(picked.recipe.id, d.id); assert.deepEqual(picked.substitutions, []);
  assert.equal(matchRecipe(picked.recipe, buildOwned([]), false).ok, false);
  assert.equal(JSON.stringify(input), before);
  const stocked = [bottle('sp-rum-white'), bottle('mx-lime-juice'), bottle('sw-simple')];
  assert.equal(generate({ ...input, source: 'inventory', kit: stocked }).ok, true);
  assert.equal(generate({ ...input, source: 'inventory', kit: stocked.map((i) => ({ ...i, level: 'out' })) }).ok, false);
});

test('the entire recipe book is eligible, including its final recipe', () => {
  const original = Math.random;
  try {
    Math.random = () => 0;
    assert.equal(generate({ ...options, source: 'all' }).recipe.id, SEED_RECIPES[0].id);
    Math.random = () => 0.999999999;
    assert.equal(generate({ ...options, source: 'all' }).recipe.id, SEED_RECIPES.at(-1).id);
  } finally { Math.random = original; }
});

test('all recipes excludes incomplete drafts and produces a library miss without adding inventory advice', () => {
  const draft = { ...recipe('Daiquiri'), id: 'draft', ingredients: [], steps: [] };
  const invalidMeasure = { ...recipe('Daiquiri'), id: 'invalid', ingredients: [{ ...recipe('Daiquiri').ingredients[0], amount: -1 }] };
  const d = recipe('Daiquiri');
  for (let n = 0; n < 12; n++) assert.equal(generate({ ...options, source: 'all', recipes: [draft, invalidMeasure, d] }).recipe.id, d.id);
  const miss = generate({ ...options, source: 'all', recipes: [draft, invalidMeasure] });
  assert.equal(miss.ok, false); assert.equal(miss.reason, 'library'); assert.deepEqual(miss.suggestions, []);
});

test('mood, theme and locked ingredient still intersect in all-recipes mode', () => {
  const d = { ...recipe('Daiquiri'), theme: 'galaxy', vibeTags: ['tropical'] };
  const other = { ...recipe('Gin & Tonic'), theme: 'garden', vibeTags: ['refreshing'] };
  const input = { ...options, source: 'all', recipes: [d, other], themes: ['galaxy'], vibes: ['tropical'], lockedIngredientId: 'sp-rum-white' };
  assert.equal(generate(input).recipe.id, d.id);
  const miss = generate({ ...input, themes: ['garden'] });
  assert.equal(miss.ok, false); assert.equal(miss.reason, 'filters'); assert.equal(miss.matchesWithoutFilters, 2);
});

test('keywords, ingredient exclusions and alcohol-free settings remain strict with no inventory', () => {
  for (const query of ['tropical no gin', 'fruity mocktail', 'halloween']) {
    const allowed = new Set(discoverDrinks(SEED_RECIPES, query).matches.filter((m) => isServingReady(m.recipe)).map((m) => m.recipe.id));
    assert.ok(allowed.size);
    for (let n = 0; n < 12; n++) {
      const picked = generate({ ...options, source: 'all', ideaQuery: query });
      assert.equal(picked.ok, true); assert.ok(allowed.has(picked.recipe.id)); assert.deepEqual(picked.substitutions, []);
      if (query.includes('mocktail')) assert.equal(isAlcoholFree(picked.recipe), true);
    }
  }
  for (let n = 0; n < 15; n++) assert.equal(isAlcoholFree(generate({ ...options, source: 'all', zeroProofMode: true }).recipe), true);
  assert.equal(generate({ ...options, source: 'all', zeroProofMode: true, ideaQuery: 'rum' }).ok, false);
});

test('an unknown idea or unavailable filter never falls back to an unrelated recipe', () => {
  const miss = generate({ ...options, source: 'all', ideaQuery: 'unicorn' });
  assert.equal(miss.ok, false); assert.equal(miss.reason, 'idea'); assert.deepEqual(miss.suggestions, []);
  const queryMiss = generate({ ...options, source: 'all', recipes: [recipe('Daiquiri')], ideaQuery: 'coffee' });
  assert.equal(queryMiss.ok, false);
});

test('first-use mode is all recipes, stocked legacy bars stay inventory, and explicit choices win', () => {
  const kit = [bottle('sp-gin')];
  assert.equal(resolveRandomSource(undefined, []), 'all');
  assert.equal(resolveRandomSource(undefined, kit), 'inventory');
  assert.equal(resolveRandomSource(undefined, [bottle('sp-gin', 'out')]), 'all');
  assert.equal(resolveRandomSource('all', kit), 'all');
  assert.equal(resolveRandomSource('inventory', []), 'inventory');
  assert.equal(resolveRandomSource('bad input', kit), 'inventory');
});

test('source choice persists per local bar, survives backup, and older backups remain readable', () => {
  const values = new Map(); globalThis.localStorage = { getItem: (k) => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) };
  try {
    const first = emptyProfileData(123); first.prefs.randomSource = 'all'; web.replaceProfileData(first);
    const second = emptyProfileData(123); second.prefs.randomSource = 'inventory'; const created = web.createProfile('Patio', second);
    assert.equal(web.loadPrefs().randomSource, 'all'); assert.equal(web.loadPrefs(created.activeId).randomSource, 'inventory');
    const parsed = parseBackup(makeBackup('Source', first)); assert.equal(parsed.data.prefs.randomSource, 'all');
    const legacy = parseBackup(makeBackup('Older bar', emptyProfileData(123))); assert.equal(legacy.data.prefs.randomSource, undefined);
    const invalid = JSON.parse(makeBackup('Source', first)); invalid.data.prefs.randomSource = 'other';
    assert.throws(() => parseBackup(JSON.stringify(invalid)), /random recipe source/);
    assert.deepEqual(web.loadKit(), []); assert.deepEqual(web.loadKit(created.activeId), []);
  } finally { delete globalThis.localStorage; }
});
