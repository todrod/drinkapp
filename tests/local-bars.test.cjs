const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const { DatabaseSync } = require('node:sqlite');
const { SEED_RECIPES } = require('../src/data/recipes.ts');
const { MY_BAR } = require('../src/data/bar.ts');
const { CATALOG_BY_ID } = require('../src/data/catalog.ts');
const { emptyProfileData, readProfileIndex, newLocalProfile, renameLocalProfile } = require('../src/logic/localProfiles.ts');
const { backupByteLength, makeBackup, parseBackup, MAX_BACKUP_BYTES } = require('../src/logic/backup.ts');
const { clearPersistenceError, getPersistenceError, getPersistenceReadError } = require('../src/persistenceStatus.ts');
const web = require('../src/db/store.web.ts');
const bottle = (id, name = id) => ({ id, catalogItemId: 'sp-gin', name, category: 'beverage', brand: null, level: 'full', isStaple: false, icon: '', addedAt: 1, updatedAt: 2 });
const source = () => {
  const d = emptyProfileData(12345);
  d.kit = MY_BAR.map(([name, id, level], n) => ({ ...bottle('row-' + n, name), catalogItemId: id, level: level ?? 'full', category: CATALOG_BY_ID[id].category }));
  d.recipes = SEED_RECIPES.map((r, n) => n === 0 ? { ...r, name: 'My existing edit', isFavorite: true, rating: 5, timesMade: 7, lastMadeAt: 100 } : r);
  d.shopping = [{ id: 'shop-1', catalogItemId: 'mx-tonic', name: 'Tonic water', done: true, addedAt: 3 }];
  d.party = { title: 'Saturday', entries: [{ recipeId: d.recipes[0].id, servings: 12 }], unit: 'oz' };
  return d;
};
function fakeLocalStorage() {
  const values = new Map(); let writes = 0; let failAt = Infinity;
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { if (++writes >= failAt) throw new Error('quota'); values.set(key, value); },
  };
  return { values, failAfter: (n) => { writes = 0; failAt = n; }, healthy: () => { failAt = Infinity; clearPersistenceError(); } };
}

test('existing browser storage remains the default bar without rewriting or clearing its keys', () => {
  const ls = fakeLocalStorage(); const d = source();
  ls.values.set('shaker:kit', JSON.stringify(d.kit)); ls.values.set('shaker:recipes', JSON.stringify(d.recipes));
  ls.values.set('shaker:prefs', JSON.stringify(d.prefs));
  const before = [...ls.values];
  const index = web.loadProfileIndex();
  assert.equal(index.activeId, 'default'); assert.equal(index.profiles[0].name, 'My bar');
  assert.equal(web.loadKit().length, 116); assert.equal(web.loadRecipes()[0].name, 'My existing edit');
  assert.deepEqual([...ls.values], before);
});

test('browser bars isolate inventory, recipe edits, favorites, history, shopping, preferences and menus', () => {
  fakeLocalStorage(); const d = source(); web.replaceProfileData(d);
  const next = web.createProfile('Patio', emptyProfileData(12345)); const id = next.activeId;
  assert.notEqual(id, 'default'); assert.deepEqual(web.loadKit(id), []);
  assert.equal(web.loadRecipes(id).length, 144); assert.equal(web.loadRecipes(id)[0].timesMade, 0);
  const changed = { ...web.loadRecipes(id)[0], rating: 2 }; web.saveRecipe(changed, id);
  web.saveKitItem(bottle('patio-gin'), id); web.savePrefs({ ...d.prefs, zeroProofMode: true }, id);
  assert.equal(web.loadKit().length, 116); assert.equal(web.loadKit(id).length, 1);
  assert.equal(web.loadRecipes()[0].rating, 5); assert.equal(web.loadRecipes(id)[0].rating, 2);
  assert.equal(web.loadPrefs().zeroProofMode, false); assert.equal(web.loadPrefs(id).zeroProofMode, true);
  assert.equal(web.loadShopping().length, 1); assert.equal(web.loadShopping(id).length, 0);
  assert.equal(web.loadParty().title, 'Saturday'); assert.equal(web.loadParty(id).entries.length, 0);
  web.setActiveProfile('default'); assert.equal(web.loadProfileIndex().activeId, 'default');
});

test('queued writes retain their captured bar after another bar is activated', () => {
  fakeLocalStorage(); const original = web.scopedToProfile('default');
  const other = web.createProfile('Other', emptyProfileData(1));
  original.saveKitItem(bottle('late-write'));
  assert.equal(web.loadKit().length, 1); assert.equal(web.loadKit(other.activeId).length, 0);
  assert.throws(() => web.scopedToProfile('../outside'));
});

test('a file backup roundtrips the 116-item bar, all recipes, edits, ratings and party without age acceptance', () => {
  const d = source(); const text = makeBackup('Alex’s bar 🍸', d); const parsed = parseBackup(text);
  assert.equal(parsed.name, 'Alex’s bar 🍸'); assert.deepEqual(parsed.data.kit, d.kit);
  assert.deepEqual(parsed.data.recipes, d.recipes); assert.deepEqual(parsed.data.shopping, d.shopping);
  assert.deepEqual(parsed.data.party, d.party); assert.equal(parsed.data.prefs.ageGateAcceptedAt, null);
  assert.equal(text.includes('ageGateAcceptedAt'), false);
  const gins = parsed.data.kit.filter((i) => i.catalogItemId === 'sp-gin');
  assert.ok(gins.length > 1); assert.equal(new Set(gins.map((i) => i.id)).size, gins.length);
});

test('restoring the same named backup creates a separate bar and preserves its source', () => {
  fakeLocalStorage(); const d = source(); web.replaceProfileData(d);
  const parsed = parseBackup(makeBackup('My bar', d));
  const next = web.createProfile(parsed.name, parsed.data);
  assert.equal(next.profiles.find((p) => p.id === next.activeId).name, 'My bar (2)');
  assert.deepEqual(web.loadKit(next.activeId), d.kit); assert.deepEqual(web.loadKit(), d.kit);
  web.deleteKitItem(d.kit[0].id, next.activeId);
  assert.equal(web.loadKit(next.activeId).length, 115); assert.equal(web.loadKit().length, 116);
});

test('malformed, oversized or unsupported backups reject before touching any saved bar', () => {
  const ls = fakeLocalStorage(); web.replaceProfileData(source()); const before = [...ls.values];
  assert.throws(() => parseBackup('not JSON')); assert.throws(() => parseBackup('{}'));
  assert.throws(() => parseBackup('x'.repeat(MAX_BACKUP_BYTES + 1)));
  for (const change of [
    (v) => { v.version = 99; }, (v) => { v.data.kit[0].level = 'infinite'; },
    (v) => { v.data.kit.push(v.data.kit[0]); }, (v) => { v.data.recipes[0].ingredients[0].amount = -1; },
    (v) => { v.data.recipes[0].sourceUrl = 'javascript:alert(1)'; }, (v) => { v.data.party.entries[0].servings = 0; },
  ]) {
    const value = JSON.parse(makeBackup('Source', source())); change(value);
    assert.throws(() => parseBackup(JSON.stringify(value)));
  }
  assert.deepEqual([...ls.values], before);
});

test('name-only drafts survive a backup and unknown ingredients cannot inherit an alcohol-free flag', () => {
  const d = emptyProfileData(null);
  d.recipes = [{ ...SEED_RECIPES[0], id: 'my-draft', name: 'An idea', ingredients: [], steps: [] },
    { ...SEED_RECIPES[0], id: 'unknown', isZeroProof: true, ingredients: [{ catalogItemId: null, displayName: 'Homemade rum', amount: 2, unit: 'oz', role: 'base', isOptional: false }] }];
  const parsed = parseBackup(makeBackup('Notes', d));
  assert.equal(parsed.data.recipes[0].steps.length, 0); assert.equal(parsed.data.recipes[1].isZeroProof, false);
});

test('failed browser restore never publishes a partial bar or changes the previous active bar', () => {
  const ls = fakeLocalStorage(); web.replaceProfileData(source());
  const originalKit = ls.values.get('shaker:state');
  ls.failAfter(1); assert.throws(() => web.createProfile('Failed', emptyProfileData(1)));
  assert.equal(web.loadProfileIndex().activeId, 'default'); assert.equal(ls.values.get('shaker:state'), originalKit);
  ls.healthy(); ls.failAfter(2); assert.throws(() => web.createProfile('Not published', emptyProfileData(1)));
  assert.equal(web.loadProfileIndex().profiles.length, 1); assert.equal(ls.values.get('shaker:state'), originalKit);
  assert.ok(getPersistenceError()); ls.healthy();
});

test('a full-bar retry is atomic when browser storage runs out of space', () => {
  const ls = fakeLocalStorage(); const d = source(); web.replaceProfileData(d);
  const before = ls.values.get('shaker:state'); const updated = { ...d, kit: [...d.kit, bottle('extra')] };
  ls.failAfter(1); assert.throws(() => web.replaceProfileData(updated));
  assert.equal(ls.values.get('shaker:state'), before);
  ls.healthy(); web.replaceProfileData(updated); assert.equal(web.loadKit().length, 117);
});

test('bulk inventory edits/clears are atomic and preserve recipes, menus, shopping and other browser bars', () => {
  const ls = fakeLocalStorage(); const d = source(); web.replaceProfileData(d);
  const other = web.createProfile('Other shelf', d).activeId;
  web.scopedToProfile('default').replaceKit([bottle('new-bottle', 'Edited name')]);
  assert.equal(web.loadKit().length, 1); assert.equal(web.loadKit()[0].name, 'Edited name');
  assert.deepEqual(web.loadRecipes(), d.recipes); assert.deepEqual(web.loadParty(), d.party); assert.deepEqual(web.loadShopping(), d.shopping);
  assert.equal(web.loadKit(other).length, 116);
  const before = ls.values.get('shaker:state'); ls.failAfter(1);
  assert.throws(() => web.scopedToProfile('default').replaceKit([])); assert.equal(ls.values.get('shaker:state'), before);
  ls.healthy(); web.scopedToProfile('default').replaceKit([]); assert.deepEqual(web.loadKit(), []);
  assert.deepEqual(web.loadParty(), d.party); assert.equal(web.loadKit(other).length, 116);
  web.replaceKit(d.kit); assert.equal(web.loadKit().length, 116);
});

test('bulk inventory changes on a legacy browser bar write only its inventory key', () => {
  const ls = fakeLocalStorage(); const d = source();
  ls.values.set('shaker:kit', JSON.stringify(d.kit)); ls.values.set('shaker:party', JSON.stringify(d.party));
  web.replaceKit([bottle('one')]); assert.equal(web.loadKit().length, 1);
  assert.equal(ls.values.get('shaker:party'), JSON.stringify(d.party)); assert.ok(!ls.values.has('shaker:state'));
});

test('damaged profile metadata fails closed and profile names cannot become filesystem paths', () => {
  assert.throws(() => readProfileIndex({ version: 1, activeId: '../../other', profiles: [] }));
  const index = readProfileIndex(null); const p = newLocalProfile('../My cabin', index);
  assert.match(p.id, /^bar-[a-z0-9]+$/); assert.equal(p.name, '../My cabin');
  assert.throws(() => renameLocalProfile(index, 'default', ' '));
  const ls = fakeLocalStorage(); ls.values.set('shaker:local-profiles:v1', '{broken');
  assert.throws(() => web.loadProfileIndex()); assert.equal(ls.values.get('shaker:local-profiles:v1'), '{broken');
  clearPersistenceError();
});

test('UTF-8 backup limits count accents and emoji correctly without a native TextEncoder dependency', () => {
  for (const text of ['abc', 'Café', '🍸', '\ud800', 'A\nB']) assert.equal(backupByteLength(text), Buffer.byteLength(text));
});

test('native bars use separate real SQLite files; a failed import rolls back before registry publication', () => {
  const files = new Map(); let failInventory = false; let failRegistryRead = false; const originalLoad = Module._load;
  const path = require.resolve('../src/db/store.ts');
  const sqlite = { openDatabaseSync: (name) => {
    if (!files.has(name)) files.set(name, new DatabaseSync(':memory:'));
    const db = files.get(name);
    return {
      execSync: (sql) => db.exec(sql),
      runSync: (sql, values = []) => { if (failInventory && sql.includes('INSERT INTO inventory')) throw new Error('disk full'); return db.prepare(sql).run(...values); },
      getAllSync: (sql, values = []) => db.prepare(sql).all(...values),
      getFirstSync: (sql, values = []) => { if (failRegistryRead && values.includes('local-profiles:v1')) throw new Error('read unavailable'); return db.prepare(sql).get(...values); },
      withTransactionSync: (action) => { db.exec('BEGIN'); try { action(); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; } },
    };
  } };
  Module._load = function (request, ...args) { return request === 'expo-sqlite' ? sqlite : originalLoad.call(this, request, ...args); };
  try {
    delete require.cache[path]; const native = require(path); const d = source(); d.prefs.randomSource = 'all'; native.replaceProfileData(d);
    const original = native.scopedToProfile('default'); const created = native.createProfile('Cabin', emptyProfileData(12345));
    assert.equal(files.size, 2); assert.equal(native.loadKit(created.activeId).length, 0);
    native.savePrefs({ ...native.loadPrefs(created.activeId), randomSource: 'inventory' }, created.activeId);
    assert.equal(native.loadPrefs().randomSource, 'all'); assert.equal(native.loadPrefs(created.activeId).randomSource, 'inventory');
    original.saveKitItem(bottle('late-native')); assert.equal(native.loadKit(created.activeId).length, 0);
    assert.equal(native.loadKit().length, 117); assert.equal(native.loadRecipes().find((r) => r.id === d.recipes[0].id).rating, 5);
    const current = native.loadProfileIndex(); failInventory = true;
    assert.throws(() => native.createProfile('Broken restore', d)); failInventory = false;
    assert.deepEqual(native.loadProfileIndex(), current); assert.equal(native.loadKit().length, 117);
    const failed = [...files.values()].at(-1); assert.equal(failed.prepare('SELECT count(*) AS n FROM inventory').get().n, 0);
    const restored = native.createProfile('Saved copy', parseBackup(makeBackup('Source', d)).data);
    assert.equal(native.loadKit(restored.activeId).length, 116); assert.equal(native.loadParty(restored.activeId).entries[0].servings, 12);
    const existingKit = native.loadKit(); failInventory = true;
    assert.throws(() => original.replaceKit([bottle('bulk-failure')])); failInventory = false;
    assert.deepEqual(native.loadKit(), existingKit, 'a failed insert rolls back the inventory delete'); clearPersistenceError();
    original.replaceKit([{ ...bottle('edited-native'), catalogItemId: 'mx-lime-juice', category: 'mixer', level: 'out' }]);
    assert.equal(native.loadKit()[0].catalogItemId, 'mx-lime-juice'); assert.equal(native.loadKit()[0].level, 'out');
    assert.equal(native.loadRecipes().find((r) => r.id === d.recipes[0].id).rating, 5); assert.equal(native.loadParty().title, 'Saturday');
    assert.equal(native.loadKit(restored.activeId).length, 116);
    original.replaceKit([]); assert.deepEqual(native.loadKit(), []); original.replaceKit(existingKit);
    assert.deepEqual(native.loadKit(), existingKit);
    native.setActiveProfile('default'); assert.equal(native.loadProfileIndex().activeId, 'default');
    failRegistryRead = true; assert.throws(() => native.loadProfileIndex()); assert.equal(getPersistenceReadError(), true);
    failRegistryRead = false; assert.equal(native.loadProfileIndex().activeId, 'default');
  } finally { Module._load = originalLoad; delete require.cache[path]; for (const db of files.values()) db.close(); clearPersistenceError(); }
});
