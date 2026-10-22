const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const worker = fs.readFileSync(path.join(root, 'public/sw.js'), 'utf8');

test('postbuild precaches exported code/fonts, is repeatable and changes the cache for a new release', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shaker-pwa-test-'));
  try {
    for (const folder of ['public', 'dist/_expo/static/js/web', 'dist/assets/fonts']) fs.mkdirSync(path.join(dir, folder), { recursive: true });
    fs.writeFileSync(path.join(dir, 'public/sw.js'), worker);
    fs.writeFileSync(path.join(dir, 'dist/index.html'), '<html><head></head><body><script src="/_expo/static/js/web/first.js"></script></body></html>');
    fs.writeFileSync(path.join(dir, 'dist/manifest.webmanifest'), '{}');
    fs.writeFileSync(path.join(dir, 'dist/_expo/static/js/web/first.js'), '// first');
    fs.writeFileSync(path.join(dir, 'dist/assets/fonts/outfit.ttf'), 'font');
    const build = () => execFileSync(process.execPath, [path.join(root, 'scripts/postbuild.mjs')], { cwd: dir, stdio: 'pipe' });
    build(); const first = fs.readFileSync(path.join(dir, 'dist/sw.js'), 'utf8');
    assert.ok(first.includes('/_expo/static/js/web/first.js')); assert.ok(first.includes('/assets/fonts/outfit.ttf'));
    assert.ok(!first.includes('/* pwa:precache */')); assert.match(first, /shaker-v4-[0-9a-f]{12}/);
    assert.ok(fs.readFileSync(path.join(dir, 'dist/index.html'), 'utf8').includes(`content="${first.match(/shaker-v4-[0-9a-f]{12}/)[0]}"`));
    build(); assert.equal(fs.readFileSync(path.join(dir, 'dist/sw.js'), 'utf8'), first);
    assert.equal(fs.readFileSync(path.join(dir, 'dist/index.html'), 'utf8').match(/pwa:injected/g).length, 1);
    const html = fs.readFileSync(path.join(dir, 'dist/index.html'), 'utf8').replace('first.js', 'second.js');
    fs.writeFileSync(path.join(dir, 'dist/index.html'), html); fs.writeFileSync(path.join(dir, 'dist/_expo/static/js/web/second.js'), '// second');
    build(); const second = fs.readFileSync(path.join(dir, 'dist/sw.js'), 'utf8');
    assert.notEqual(second.match(/shaker-v4-[0-9a-f]{12}/)[0], first.match(/shaker-v4-[0-9a-f]{12}/)[0]);
  } finally {
    const target = path.resolve(dir);
    if (path.dirname(target) !== path.resolve(os.tmpdir()) || !path.basename(target).startsWith('shaker-pwa-test-')) throw Error('Unexpected test cleanup path');
    fs.rmSync(target, { recursive: true, force: true });
  }
});

test('service worker waits for precaching and retains the old worker if a core file fails', async () => {
  for (const fail of [false, true]) {
    const handlers = {}; let skipped = false; let requested;
    vm.runInNewContext(worker, {
      Request: class { constructor(url, options) { this.url = url; this.cache = options.cache; } },
      self: { addEventListener: (name, fn) => { handlers[name] = fn; }, skipWaiting: async () => { skipped = true; } },
      caches: { open: async () => ({ addAll: async (paths) => { requested = paths; if (fail) throw Error('offline'); } }) },
    });
    let pending; handlers.install({ waitUntil: (promise) => { pending = promise; } });
    assert.equal(skipped, false);
    if (fail) { await assert.rejects(pending, /offline/); assert.equal(skipped, false); }
    else {
      await pending; assert.equal(skipped, false, 'download completion must not force an update');
      assert.ok(requested.some((r) => r.url === '/index.html')); assert.ok(requested.some((r) => r.url === '/icons/icon-512.png')); assert.ok(requested.every((r) => r.cache === 'no-store'));
      let reply; handlers.message({ data: { type: 'SHAKER_GET_VERSION' }, source: { postMessage: (data) => { reply = data; } } });
      assert.equal(reply.type, 'SHAKER_VERSION'); assert.equal(reply.version, 'shaker-v4-install');
      handlers.message({ data: { type: 'SHAKER_ACTIVATE_UPDATE' }, waitUntil: (promise) => { pending = promise; } });
      await pending; assert.equal(skipped, true);
    }
  }
});

test('activation cleans up only Shaker caches and claims clients without touching personal storage', async () => {
  const handlers = {}; const deleted = []; let claimed = false;
  vm.runInNewContext(worker, {
    self: { addEventListener: (name, fn) => { handlers[name] = fn; }, clients: { claim: async () => { claimed = true; } } },
    caches: { keys: async () => ['shaker-v4-old', 'shaker-v4-install', 'another-app-cache'], delete: async (key) => { deleted.push(key); } },
  });
  let pending; handlers.activate({ waitUntil: (promise) => { pending = promise; } }); await pending;
  assert.deepEqual(deleted, ['shaker-v4-old']); assert.equal(claimed, true);
});

test('navigation bypasses HTTP cache and offline HTML stays paired with its precached release', async () => {
  for (const offline of [false, true]) {
    const handlers = {}; const networkPage = { body: 'new network page' }; const cachedPage = { body: 'complete cached release' };
    vm.runInNewContext(worker, {
      URL,
      self: { location: { origin: 'https://shaker.example' }, addEventListener: (name, fn) => { handlers[name] = fn; } },
      fetch: async (_request, options) => { assert.equal(options.cache, 'no-store'); if (offline) throw Error('offline'); return networkPage; },
      caches: {
        match: () => assert.fail('do not select another release’s cached HTML'),
        open: async (name) => { assert.equal(name, 'shaker-v4-install'); return { match: async (url) => { assert.equal(url, '/index.html'); return cachedPage; }, put: () => assert.fail('do not replace the old offline index with an incomplete new release') }; },
      },
    });
    let response; handlers.fetch({ request: { method: 'GET', mode: 'navigate', url: 'https://shaker.example/' }, respondWith: (promise) => { response = promise; } });
    assert.equal(await response, offline ? cachedPage : networkPage);
  }
});
