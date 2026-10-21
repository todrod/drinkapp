const { test } = require('node:test');
const assert = require('node:assert/strict');
const { CATALOG, CATALOG_BY_ID } = require('../src/data/catalog.ts');
const { SEED_RECIPES } = require('../src/data/recipes.ts');
const { DISCOVERY_RECIPES } = require('../src/data/discoveryRecipes.ts');
const { inCollection, trendingRank } = require('../src/data/curation.ts');
const { THEMES } = require('../src/data/seed.ts');
const { normalizeText } = require('../src/logic/text.ts');
const { discoverDrinks } = require('../src/logic/discovery.ts');
const { generate, buildOwned, matchRecipe } = require('../src/logic/generator.ts');
const { loadRecipes } = require('../src/db/store.web.ts');

function kit(ids) {
  return ids.map((id) => ({ id: 'test-' + id, catalogItemId: id, name: CATALOG_BY_ID[id].name,
    category: CATALOG_BY_ID[id].category, brand: null, level: 'full', isStaple: false,
    icon: CATALOG_BY_ID[id].icon, addedAt: 0, updatedAt: 0 }));
}
const fullBar = kit(CATALOG.map((c) => c.id));
const options = { recipes: SEED_RECIPES, kit: fullBar, allowSubstitutes: true, zeroProofMode: false, vibes: [] };
const results = (query) => discoverDrinks(SEED_RECIPES, query);
const uses = (r, ids) => r.ingredients.some((i) => ids.includes(i.catalogItemId));

test('48 additions have stable unique ids, known ingredients, valid amounts, methods, themes and sources', () => {
  assert.equal(DISCOVERY_RECIPES.length, 48);
  assert.equal(SEED_RECIPES.length, 144);
  assert.equal(new Set(SEED_RECIPES.map((r) => r.id)).size, SEED_RECIPES.length);
  assert.equal(new Set(SEED_RECIPES.map((r) => normalizeText(r.name))).size, SEED_RECIPES.length);
  assert.equal(new Set(CATALOG.map((c) => c.id)).size, CATALOG.length);
  assert.equal(SEED_RECIPES.filter((r) => matchRecipe(r, buildOwned(fullBar), false).ok).length, SEED_RECIPES.length);
  for (const r of SEED_RECIPES) {
    assert.ok(r.ingredients.some((i) => !i.isOptional && ['base', 'modifier', 'mixer', 'sweetener'].includes(i.role)), r.name);
    assert.ok(r.steps.length, r.name);
    if (r.theme) assert.ok(THEMES.some((t) => t.id === r.theme), r.name);
    for (const i of r.ingredients) {
      assert.ok(CATALOG_BY_ID[i.catalogItemId], `${r.name}: ${i.catalogItemId}`);
      assert.ok(i.amount === null || Number.isFinite(i.amount) && i.amount > 0, r.name);
    }
    if (r.id.startsWith('bank-')) {
      assert.equal(r.rating, null, 'editorial picks must not fabricate user ratings');
      assert.ok(r.sourceNote, r.name);
      assert.ok(r.sourceUrl?.startsWith('https://') || r.sourceNote.includes('house recipe'), r.name);
    }
    if (r.isZeroProof) assert.ok(r.ingredients.every((i) => CATALOG_BY_ID[i.catalogItemId].typicalAbv === 0), r.name);
  }
});

test('dated popular and highly rated collections remain separate from personal stars/favorites', () => {
  assert.equal(SEED_RECIPES.filter((r) => inCollection(r, 'trending')).length, 10);
  assert.equal(trendingRank(SEED_RECIPES.find((r) => r.name === 'Margarita')), 1);
  assert.equal(trendingRank(SEED_RECIPES.find((r) => r.name === 'Dry Martini')), 10);
  assert.equal(SEED_RECIPES.filter((r) => inCollection(r, 'highly-rated')).length, 11);
  assert.ok(SEED_RECIPES.filter((r) => inCollection(r, 'all-time')).length >= 20);
  const edited = { ...SEED_RECIPES.find((r) => r.name === 'Margarita'), origin: 'user' };
  assert.equal(inCollection(edited, 'trending'), false);
  assert.ok(results('my favorites').matches.length === 0);
});

test('multiword flavors and ingredients intersect and adding a term narrows the results', () => {
  const broad = results('refreshing rum').matches;
  const narrow = results('I feel like refreshing rum with lime please').matches;
  assert.ok(narrow.length > 1 && narrow.length <= broad.length);
  assert.ok(narrow.some((m) => m.recipe.name === 'Mojito'));
  for (const { recipe } of narrow) {
    assert.ok(uses(recipe, CATALOG.filter((c) => c.spiritType === 'rum').map((c) => c.id)));
    assert.ok(uses(recipe, ['gn-lime', 'mx-lime-juice']));
    assert.ok(recipe.vibeTags.includes('refreshing'));
  }
});

test('exact names and accents work; an OR joins alternatives instead of requiring both spirits', () => {
  assert.deepEqual(results('PINA COLADA').matches.map((m) => m.recipe.name), ['Piña Colada']);
  assert.deepEqual(results('bees knees').matches.map((m) => m.recipe.name), ["Bee's Knees"]);
  assert.deepEqual(results('vieux carre').matches.map((m) => m.recipe.name), ['Vieux Carré']);
  assert.ok(results('gin or vodka citrus').matches.length > 3);
  assert.ok(results('gin or vodka citrus').matches.every(({ recipe }) => uses(recipe, ['sp-gin', 'sp-vodka', 'sp-vodka-vanilla', 'lq-sloe-gin'])));
});

test('a custom recipe name does not shadow the flavor vocabulary', () => {
  const custom = { ...SEED_RECIPES[0], id: 'user-tropical', origin: 'user', name: 'Tropical', vibeTags: [] };
  const matches = discoverDrinks([...SEED_RECIPES, custom], 'tropical').matches;
  assert.ok(matches.some((m) => m.recipe.id === custom.id));
  assert.ok(matches.some((m) => m.recipe.name === 'Piña Colada'));
});

test('negations apply to ingredient lists and survive OR/AND lists', () => {
  const noGin = results('tropical without gin');
  assert.ok(noGin.matches.length);
  assert.ok(noGin.matches.every(({ recipe }) => !uses(recipe, ['sp-gin', 'lq-sloe-gin'])));
  const excluded = results('fruity no gin or vodka').intent.excludedIngredientIds;
  assert.ok(excluded.has('sp-gin') && excluded.has('sp-vodka'));
  assert.ok(results('coffee no dairy').matches.every(({ recipe }) => !uses(recipe, ['mx-cream', 'mx-half-and-half', 'lq-irish-cream', 'lq-tiramisu'])));
  assert.ok(results('not too sweet').matches.every(({ recipe }) => !recipe.vibeTags.some((t) => ['sweet', 'dessert'].includes(t))));
});

test('substitutions cannot sneak an excluded spirit back into the selected drink', () => {
  const soda = SEED_RECIPES.find((r) => r.name === 'Vodka Soda');
  const ginBar = kit(['sp-gin', 'mx-soda']);
  assert.equal(matchRecipe(soda, buildOwned(ginBar), true).ok, true);
  const result = generate({ ...options, recipes: [soda], kit: ginBar, ideaQuery: 'vodka no gin' });
  assert.equal(result.ok, false);
  assert.ok(result.suggestions.some((s) => s.catalogItemId === 'sp-vodka'));
});

test('substitutions preserve the requested spirit or smoky flavor, including explicit OR alternatives', () => {
  const daiquiri = SEED_RECIPES.find((r) => r.name === 'Daiquiri');
  const vodkaBar = kit(['sp-vodka', 'mx-lime-juice', 'sw-simple']);
  assert.equal(matchRecipe(daiquiri, buildOwned(vodkaBar), true).ok, true);
  assert.equal(generate({ ...options, recipes: [daiquiri], kit: vodkaBar, ideaQuery: 'rum' }).ok, false);
  assert.equal(generate({ ...options, recipes: [daiquiri], kit: vodkaBar, ideaQuery: 'rum or vodka' }).ok, true);
  const mezcal = SEED_RECIPES.find((r) => r.name === 'Mezcal Margarita');
  const tequilaBar = kit(['sp-tequila-blanco', 'lq-cointreau', 'mx-lime-juice', 'sw-agave']);
  assert.equal(matchRecipe(mezcal, buildOwned(tequilaBar), true).ok, true);
  const result = generate({ ...options, recipes: [mezcal], kit: tequilaBar, ideaQuery: 'smoky' });
  assert.equal(result.ok, false);
  assert.ok(result.suggestions.some((s) => s.catalogItemId === 'sp-mezcal'));
});

test('alcohol-free requests are strict even in closest suggestions or combined with preferences', () => {
  for (const query of ['tropical mocktail', 'no alcohol', 'without booze', 'spooky non-alcoholic unicorn']) {
    const result = results(query);
    assert.ok(result.matches.every((m) => m.recipe.isZeroProof));
    assert.ok(result.closest.every((m) => m.recipe.isZeroProof));
  }
  for (let i = 0; i < 20; i++) {
    const result = generate({ ...options, ideaQuery: 'tropical mocktail' });
    assert.equal(result.ok, true);
    assert.equal(result.recipe.isZeroProof, true);
  }
  assert.equal(generate({ ...options, zeroProofMode: true, ideaQuery: 'rum' }).ok, false);
});

test('themes, occasions and collections resolve locally', () => {
  for (const [query, theme] of [['halloween', 'spooky'], ['Star Wars', 'galaxy'], ['Lord of the Rings', 'middle-earth'], ['Christmas', 'holiday'], ['garden party', 'garden']]) {
    assert.ok(results(query).matches.length > 0, query);
    assert.ok(results(query).matches.every((m) => m.recipe.theme === theme), query);
  }
  assert.ok(results('brunch bubbly').matches.some((m) => m.recipe.name === 'Bellini'));
  assert.equal(results('top rated').matches.length, 11);
  assert.equal(results('trending').matches.length, 10);
});

test('unknown terms stay visible, spelling suggestions are explicit, and no match never becomes an unrelated pick', () => {
  const unknown = results('spooky unicorn no gin');
  assert.equal(unknown.matches.length, 0);
  assert.deepEqual(unknown.intent.unknown, ['unicorn']);
  assert.ok(unknown.closest.length);
  assert.ok(unknown.closest.every((m) => m.missing.includes('unicorn') && !uses(m.recipe, ['sp-gin'])));
  assert.ok(results('strawbery').intent.suggestions.includes('strawberry'));
  assert.equal(generate({ ...options, ideaQuery: 'unicorn' }).ok, false);
});

test('an empty bar gets ingredient advice for the requested idea, while an empty query retains normal random selection', () => {
  const missing = generate({ ...options, kit: [], ideaQuery: 'Paper Plane' });
  assert.equal(missing.ok, false);
  assert.equal(missing.reason, 'idea');
  assert.equal(missing.ideaMatches, 1);
  assert.equal(generate({ ...options, ideaQuery: '' }).ok, true);
  const noStock = fullBar.map((i) => ({ ...i, level: 'out' }));
  assert.equal(generate({ ...options, kit: noStock, ideaQuery: 'Paper Plane' }).ok, false);
});

test('existing installs receive additions once without overwriting edits, ratings or custom recipes', () => {
  const edited = { ...SEED_RECIPES[0], name: 'My edited recipe', rating: 4, isFavorite: true, timesMade: 7 };
  const custom = { ...edited, id: 'user-keep', origin: 'user', name: 'My own cocktail' };
  const values = new Map([['shaker:recipes', JSON.stringify([edited, custom])]]);
  global.localStorage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  try {
    const first = loadRecipes();
    const second = loadRecipes();
    assert.equal(first.length, 145);
    assert.equal(second.length, first.length);
    assert.deepEqual(first.find((r) => r.id === edited.id), edited);
    assert.deepEqual(first.find((r) => r.id === custom.id), custom);
    assert.equal(first.filter((r) => r.id.startsWith('bank-')).length, 48);
  } finally { delete global.localStorage; }
});
