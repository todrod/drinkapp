const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createUpdateController, UPDATE_CHECK_INTERVAL } = require('../src/updates/controller.web.ts');
const BUILD = 'shaker-v4-111111111111';
const NEXT = 'shaker-v4-222222222222';

function events(target = {}) {
  const listeners = new Map();
  return Object.assign(target, {
    listeners,
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
    emit(type, event = {}) { listeners.get(type)?.forEach((fn) => fn(event)); },
  });
}
function setup({ waitingVersion = null, complete = true, supported = true } = {}) {
  let reloads = 0; let checks = 0; let registrations = 0; let rejectCheck = false; let holdCheck = null;
  const timeouts = new Map(); const intervals = new Map(); let id = 0;
  const registration = events({ waiting: null, installing: null, update: () => { checks++; return rejectCheck ? Promise.reject(Error('offline')) : holdCheck ?? Promise.resolve(); } });
  const container = events({ controller: null, register: async (url, options) => { registrations++; assert.equal(url, '/sw.js'); assert.equal(options.updateViaCache, 'none'); return registration; } });
  const document = events({ readyState: complete ? 'complete' : 'loading', visibilityState: 'visible', querySelector: () => supported ? { getAttribute: () => BUILD } : null });
  const browser = events({ document, navigator: { serviceWorker: container, onLine: true }, isSecureContext: true,
    location: { reload: () => reloads++ },
    setTimeout: (fn) => { const key = ++id; timeouts.set(key, fn); return key; }, clearTimeout: (key) => timeouts.delete(key),
    setInterval: (fn, delay) => { assert.equal(delay, UPDATE_CHECK_INTERVAL); const key = ++id; intervals.set(key, fn); return key; }, clearInterval: (key) => intervals.delete(key),
  });
  const makeWorker = (version = NEXT, state = 'installed') => events({ state, messages: [], postMessage(message) {
    this.messages.push(message.type);
    if (message.type === 'SHAKER_GET_VERSION') container.emit('message', { source: this, data: { type: 'SHAKER_VERSION', version } });
  } });
  if (waitingVersion) registration.waiting = makeWorker(waitingVersion);
  const controller = createUpdateController(browser);
  return { controller, browser, registration, container, document, timeouts, intervals, makeWorker,
    counts: () => ({ reloads, checks, registrations }), rejectChecks: () => { rejectCheck = true; }, holdChecks: (promise) => { holdCheck = promise; } };
}
const tick = () => new Promise((resolve) => setImmediate(resolve));
function offer(b, worker = b.makeWorker()) {
  b.registration.installing = worker; worker.state = 'installing'; b.registration.emit('updatefound');
  b.registration.waiting = worker; worker.state = 'installed'; worker.emit('statechange'); return worker;
}

test('a fully installed release offers an update, Later keeps it available, and only a tap activates/reloads once', async () => {
  const b = setup(); await tick(); const worker = offer(b);
  assert.equal(b.controller.getSnapshot().available, true);
  assert.equal(b.counts().reloads, 0); assert.ok(!worker.messages.includes('SHAKER_ACTIVATE_UPDATE'));
  b.controller.dismiss(); assert.equal(b.controller.getSnapshot().dismissed, true);
  b.controller.apply(); b.controller.apply();
  assert.equal(b.controller.getSnapshot().applying, true);
  assert.equal(worker.messages.filter((m) => m === 'SHAKER_ACTIVATE_UPDATE').length, 1);
  assert.equal(b.counts().reloads, 0, 'wait for the replacement controller before reloading');
  b.container.controller = worker; b.container.emit('controllerchange'); b.container.emit('controllerchange');
  assert.equal(b.counts().reloads, 1); assert.equal(b.timeouts.size, 0); b.controller.dispose();
});

test('installing or failed downloads never offer a ready update', async () => {
  const b = setup(); await tick(); const worker = b.makeWorker(NEXT, 'installing');
  b.registration.installing = worker; b.registration.emit('updatefound');
  assert.equal(b.controller.getSnapshot().available, false);
  worker.state = 'redundant'; worker.emit('statechange');
  assert.equal(b.controller.getSnapshot().available, false); b.controller.apply();
  assert.equal(b.counts().reloads, 0); b.controller.dispose();
});

test('first install and a refreshed page already on the waiting build never prompt or reload', async () => {
  const b = setup(); await tick(); const worker = offer(b, b.makeWorker(BUILD));
  assert.equal(b.controller.getSnapshot().available, false);
  assert.ok(worker.messages.includes('SHAKER_ACTIVATE_UPDATE'));
  b.container.controller = worker; b.container.emit('controllerchange');
  assert.equal(b.controller.getSnapshot().available, false); assert.equal(b.counts().reloads, 0); b.controller.dispose();
});

test('a release activated by another window offers a manual reload without interrupting this one', async () => {
  const b = setup(); await tick(); const worker = b.makeWorker(NEXT, 'activated');
  b.container.controller = worker; b.container.emit('controllerchange');
  assert.equal(b.controller.getSnapshot().available, true); assert.equal(b.counts().reloads, 0);
  b.controller.apply(); assert.equal(b.counts().reloads, 1); assert.ok(!worker.messages.includes('SHAKER_ACTIVATE_UPDATE')); b.controller.dispose();
});

test('a waiting release present at registration is discovered and unrelated messages are ignored', async () => {
  const b = setup({ waitingVersion: NEXT }); await tick();
  assert.equal(b.controller.getSnapshot().available, true);
  b.controller.dismiss();
  b.container.emit('message', { source: b.makeWorker(), data: { type: 'SHAKER_VERSION', version: 'shaker-v4-333333333333' } });
  assert.equal(b.controller.getSnapshot().dismissed, true);
  const another = offer(b, b.makeWorker('shaker-v4-333333333333'));
  assert.equal(b.controller.getSnapshot().dismissed, false); assert.ok(another.messages.length > 0); b.controller.dispose();
});

test('resume, online and minute checks are deduplicated; background/offline checks pause and disposal cleans up', async () => {
  const b = setup(); await tick(); let release;
  b.holdChecks(new Promise((resolve) => { release = resolve; }));
  b.browser.emit('focus'); b.browser.emit('online'); b.document.emit('visibilitychange');
  await tick();
  assert.equal(b.counts().checks, 1); release(); await tick();
  b.document.visibilityState = 'hidden'; [...b.intervals.values()][0](); assert.equal(b.counts().checks, 1);
  b.document.visibilityState = 'visible'; b.browser.navigator.onLine = false; b.browser.emit('focus'); assert.equal(b.counts().checks, 1);
  b.browser.navigator.onLine = true; b.rejectChecks(); b.browser.emit('online'); await tick();
  assert.equal(b.controller.getSnapshot().error, null, 'a failed background check is silent');
  b.controller.dispose(); assert.equal(b.intervals.size, 0); assert.equal(b.timeouts.size, 0);
  for (const obj of [b.browser, b.document, b.container, b.registration]) assert.ok([...obj.listeners.values()].every((set) => set.size === 0));
});

test('activation failures and timeouts remain retryable without an unsolicited reload', async () => {
  const b = setup(); await tick(); const worker = offer(b);
  b.controller.apply(); [...b.timeouts.values()][0]();
  assert.equal(b.controller.getSnapshot().applying, false); assert.ok(b.controller.getSnapshot().error); assert.equal(b.counts().reloads, 0);
  b.controller.apply(); assert.equal(b.controller.getSnapshot().applying, true);
  b.container.controller = worker; b.container.emit('controllerchange'); assert.equal(b.counts().reloads, 1); b.controller.dispose();
});

test('registration waits for load; development/unsupported pages and disposed setup do not register', async () => {
  const b = setup({ complete: false }); assert.equal(b.counts().registrations, 0);
  b.browser.emit('load'); await tick(); assert.equal(b.counts().registrations, 1); b.controller.dispose();
  const dev = setup({ supported: false }); await tick(); assert.equal(dev.counts().registrations, 0); dev.controller.dispose();
  const gone = setup({ complete: false }); gone.controller.dispose(); gone.browser.emit('load'); await tick(); assert.equal(gone.counts().registrations, 0);
});

test('manual checks report current only after a successful check and can be repeated', async () => {
  const b = setup(); await tick();
  const first = b.controller.check(); assert.equal(b.controller.getSnapshot().checking, true);
  await first;
  assert.equal(b.controller.getSnapshot().checking, false); assert.equal(b.controller.getSnapshot().checkResult, 'current');
  assert.equal(b.counts().checks, 1); assert.equal(b.counts().reloads, 0); assert.equal(b.timeouts.size, 0);
  await b.controller.check(); assert.equal(b.counts().checks, 2); b.controller.dispose();
});

test('manual checks wait for downloading assets and a version reply before offering an update', async () => {
  const b = setup(); await tick(); const worker = b.makeWorker(NEXT, 'installing');
  b.registration.update = async () => { b.registration.installing = worker; b.registration.emit('updatefound'); };
  await b.controller.check();
  assert.equal(b.controller.getSnapshot().checking, true); assert.equal(b.controller.getSnapshot().available, false);
  assert.notEqual(b.controller.getSnapshot().checkResult, 'current');
  b.registration.installing = null; b.registration.waiting = worker; worker.state = 'installed'; worker.emit('statechange');
  assert.equal(b.controller.getSnapshot().checking, false); assert.equal(b.controller.getSnapshot().available, true);
  assert.equal(b.timeouts.size, 0); assert.equal(b.counts().reloads, 0); b.controller.dispose();
});

test('offline checks preserve a previously downloaded update without claiming to be current', async () => {
  const b = setup({ waitingVersion: NEXT }); await tick(); b.browser.navigator.onLine = false;
  await b.controller.check();
  assert.equal(b.controller.getSnapshot().checkResult, 'offline'); assert.equal(b.controller.getSnapshot().checking, false);
  assert.equal(b.controller.getSnapshot().available, true); assert.equal(b.counts().checks, 0);
  assert.equal(b.timeouts.size, 0); assert.equal(b.counts().reloads, 0); b.controller.dispose();
});

test('failed network checks and synchronous browser errors remain retryable', async () => {
  const b = setup(); await tick();
  for (const update of [() => { throw Error('invalid state'); }, async () => { throw Error('offline'); }]) {
    b.registration.update = update; await b.controller.check();
    assert.equal(b.controller.getSnapshot().checkResult, 'error'); assert.equal(b.controller.getSnapshot().checking, false);
    b.registration.update = async () => {}; await b.controller.check();
    assert.equal(b.controller.getSnapshot().checkResult, 'current');
  }
  assert.equal(b.counts().reloads, 0); b.controller.dispose();
});

test('failed installs and a stalled version handshake end the manual check with a retryable error', async () => {
  const b = setup(); await tick(); const worker = b.makeWorker(NEXT, 'installing');
  b.registration.installing = worker;
  await b.controller.check(); worker.state = 'redundant'; worker.emit('statechange');
  assert.equal(b.controller.getSnapshot().checkResult, 'error'); assert.equal(b.controller.getSnapshot().available, false);
  b.registration.installing = null; worker.state = 'installed'; b.registration.waiting = worker;
  worker.postMessage = () => {};
  await b.controller.check(); assert.equal(b.controller.getSnapshot().checking, true);
  [...b.timeouts.values()][0]();
  assert.equal(b.controller.getSnapshot().checking, false); assert.equal(b.controller.getSnapshot().checkResult, 'error');
  assert.equal(b.counts().reloads, 0); b.controller.dispose();
});

test('manual and background requests share an in-flight check and rapid taps do not duplicate work', async () => {
  const b = setup(); await tick(); let release;
  b.holdChecks(new Promise((resolve) => { release = resolve; }));
  b.browser.emit('focus'); await tick(); const manual = b.controller.check(); await b.controller.check(); await tick();
  assert.equal(b.counts().checks, 1); assert.equal(b.controller.getSnapshot().checking, true);
  release(); await manual;
  assert.equal(b.controller.getSnapshot().checkResult, 'current'); assert.equal(b.counts().checks, 1); b.controller.dispose();
});

test('manual checks retry blocked registration, while unsupported pages stay inert', async () => {
  const b = setup({ complete: false }); b.container.register = () => { throw Error('blocked'); };
  b.browser.emit('load'); await tick(); await b.controller.check();
  assert.equal(b.controller.getSnapshot().checkResult, 'error');
  b.container.register = async () => b.registration; await b.controller.check();
  assert.equal(b.controller.getSnapshot().checkResult, 'current'); b.controller.dispose();
  const dev = setup({ supported: false }); await dev.controller.check();
  assert.equal(dev.controller.getSnapshot().supported, false); assert.equal(dev.controller.getSnapshot().checking, false);
  assert.equal(dev.counts().registrations, 0); dev.controller.dispose();
});
