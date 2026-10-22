const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createInstallController, INSTALL_HINT_KEY, INSTALL_HINT_COOLDOWN } = require('../src/install/controller.web.ts');

function browser({ ua = 'Chrome Desktop', platform = 'Win32', touches = 0, standalone = false, secure = true, storage = new Map(), blocked = false } = {}) {
  const listeners = new Map(); const changes = new Set();
  const display = { matches: standalone, addEventListener: (_type, fn) => changes.add(fn), removeEventListener: (_type, fn) => changes.delete(fn) };
  const target = {
    navigator: { userAgent: ua, platform, maxTouchPoints: touches }, isSecureContext: secure,
    localStorage: { getItem: (key) => { if (blocked) throw Error('blocked'); return storage.get(key) ?? null; }, setItem: (key, value) => { if (blocked) throw Error('blocked'); storage.set(key, value); } },
    matchMedia: () => display,
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
  };
  return { target, storage, listeners, changes, emit: (type, event = {}) => listeners.get(type)?.forEach((fn) => fn(event)), display: (matches) => { display.matches = matches; changes.forEach((fn) => fn()); } };
}

test('an early install event is captured before subscription, invoked synchronously and consumed once', async () => {
  const b = browser(); const controller = createInstallController(b.target); let prevented = 0; let calls = 0;
  b.emit('beforeinstallprompt', { preventDefault() { prevented++; }, prompt() { calls++; return Promise.resolve({ outcome: 'accepted' }); } });
  assert.equal(prevented, 1); assert.equal(controller.getSnapshot().canPrompt, true);
  let updates = 0; const unsubscribe = controller.subscribe(() => updates++);
  const request = controller.requestInstall();
  assert.equal(calls, 1, 'the browser prompt must run within the tap’s activation');
  assert.equal(controller.getSnapshot().prompting, true);
  assert.equal(await controller.requestInstall(), 'busy');
  assert.equal(await request, 'accepted');
  assert.equal(controller.getSnapshot().installed, false, 'acceptance is not installation confirmation');
  assert.equal(await controller.requestInstall(), 'instructions'); assert.equal(calls, 1);
  b.emit('appinstalled');
  assert.equal(controller.getSnapshot().installed, true); assert.equal(controller.getSnapshot().canSuggest, false);
  assert.equal(await controller.requestInstall(), 'installed'); assert.ok(updates > 0);
  unsubscribe(); controller.dispose();
  assert.ok([...b.listeners.values()].every((set) => set.size === 0)); assert.equal(b.changes.size, 0);
});

test('older userChoice promises, dismissals and browser errors recover to manual instructions', async () => {
  const b = browser(); const c = createInstallController(b.target);
  b.emit('beforeinstallprompt', { preventDefault() {}, prompt: async () => {}, userChoice: Promise.resolve({ outcome: 'dismissed' }) });
  assert.equal(await c.requestInstall(), 'dismissed'); assert.equal(c.getSnapshot().prompting, false);
  assert.equal(await c.requestInstall(), 'instructions');
  b.emit('beforeinstallprompt', { preventDefault() {}, prompt: () => { throw Error('unavailable'); } });
  assert.equal(await c.requestInstall(), 'error'); assert.equal(c.getSnapshot().prompting, false);
  assert.equal(c.getSnapshot().canPrompt, false); c.dispose();
});

test('Not now persists for a week while leaving manual install available', async () => {
  const b = browser({ ua: 'iPhone Safari' }); const now = 10_000;
  const c = createInstallController(b.target, () => now); c.dismissHint();
  assert.equal(Number(b.storage.get(INSTALL_HINT_KEY)), now + INSTALL_HINT_COOLDOWN);
  c.dispose(); const reopened = createInstallController(b.target, () => now + 1_000);
  assert.ok(reopened.getSnapshot().hintDismissedUntil > now + 1_000);
  assert.ok(reopened.getSnapshot().hintDismissedUntil <= now + INSTALL_HINT_COOLDOWN);
  b.emit('beforeinstallprompt', { preventDefault() {}, prompt: async () => ({ outcome: 'accepted' }) });
  assert.equal(await reopened.requestInstall(), 'accepted'); reopened.dispose();
});

test('iPhone and desktop-UA iPad receive home-screen guidance without an install API', () => {
  for (const options of [{ ua: 'iPhone Safari' }, { ua: 'Mac Safari', platform: 'MacIntel', touches: 5 }]) {
    const b = browser(options); const c = createInstallController(b.target);
    assert.equal(c.getSnapshot().platform, 'ios'); assert.equal(c.getSnapshot().canSuggest, true); assert.equal(c.getSnapshot().canPrompt, false);
    c.dispose();
  }
  const b = browser({ ua: 'Android Chrome' }); const c = createInstallController(b.target);
  assert.equal(c.getSnapshot().platform, 'android'); assert.equal(c.getSnapshot().canSuggest, false); c.dispose();
});

test('installed display mode and iOS standalone suppress suggestions and native prompting', async () => {
  for (const ios of [false, true]) {
    const b = browser({ ua: 'iPhone Safari', standalone: !ios });
    if (ios) b.target.navigator.standalone = true;
    const c = createInstallController(b.target);
    assert.equal(c.getSnapshot().installed, true); assert.equal(c.getSnapshot().canSuggest, false);
    b.emit('beforeinstallprompt', { prompt() { assert.fail('installed app must not prompt'); } });
    assert.equal(await c.requestInstall(), 'installed'); c.dispose();
  }
  const b = browser(); const c = createInstallController(b.target); b.display(true);
  assert.equal(c.getSnapshot().installed, true); c.dispose();
});

test('blocked storage, malformed preferences and insecure contexts do not break the page', () => {
  const b = browser({ ua: 'iPhone Safari', blocked: true }); const c = createInstallController(b.target, () => 1_000);
  assert.doesNotThrow(c.dismissHint); assert.equal(c.getSnapshot().hintDismissedUntil, 1_000 + INSTALL_HINT_COOLDOWN); c.dispose();
  const other = browser({ ua: 'iPhone Safari', secure: false, storage: new Map([[INSTALL_HINT_KEY, 'NaN']]) });
  const d = createInstallController(other.target); assert.equal(d.getSnapshot().hintDismissedUntil, 0); assert.equal(d.getSnapshot().canSuggest, false); d.dispose();
});
