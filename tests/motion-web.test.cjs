const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const { createShakeDetector } = require('../src/logic/shake.ts');

let moduleId = 0;
function loadMotion() {
  const url = pathToFileURL(path.resolve(__dirname, '../src/sensors/motion.web.ts'));
  url.search = `test=${moduleId++}`;
  return import(url.href);
}
function browser({ secure = true, requestPermission, hasMotion = true } = {}) {
  const listeners = new Set();
  class DeviceMotionEvent {}
  if (requestPermission) DeviceMotionEvent.requestPermission = requestPermission;
  global.window = {
    isSecureContext: secure,
    DeviceMotionEvent: hasMotion ? DeviceMotionEvent : undefined,
    addEventListener(type, listener) {
      assert.equal(type, 'devicemotion');
      listeners.add(listener);
    },
    removeEventListener(type, listener) {
      assert.equal(type, 'devicemotion');
      listeners.delete(listener);
    },
  };
  global.document = { visibilityState: 'visible' };
  return {
    listeners,
    emit(accelerationIncludingGravity) {
      listeners.forEach((listener) => listener({ accelerationIncludingGravity }));
    },
  };
}
afterEach(() => { delete global.window; delete global.document; });

test('iOS offers enable before any motion arrives and requests permission synchronously from the tap', async () => {
  let calls = 0;
  browser({ requestPermission: () => { calls++; return Promise.resolve('granted'); } });
  const motion = await loadMotion();
  assert.deepEqual(await motion.getMotionState(), { support: 'supported', permission: 'prompt' });
  const pending = motion.requestMotionPermission();
  assert.equal(calls, 1, 'request must run before the first await loses user activation');
  assert.equal(await pending, 'granted');
  assert.deepEqual(await motion.getMotionState(), { support: 'supported', permission: 'granted' });
});

test('denial and browser permission errors remain recoverable', async () => {
  let answer = 'denied';
  browser({ requestPermission: () => answer === 'error' ? Promise.reject(new Error('blocked')) : Promise.resolve(answer) });
  const motion = await loadMotion();
  assert.equal(await motion.requestMotionPermission(), 'denied');
  assert.equal((await motion.getMotionState()).permission, 'denied');
  answer = 'error';
  assert.equal(await motion.requestMotionPermission(), 'denied');
  answer = 'granted';
  assert.equal(await motion.requestMotionPermission(), 'granted');
});

test('non-prompting browsers can listen; insecure or unsupported contexts cannot enable', async () => {
  browser();
  const motion = await loadMotion();
  assert.deepEqual(await motion.getMotionState(), { support: 'supported', permission: 'granted' });
  assert.equal(await motion.requestMotionPermission(), 'granted');
  window.isSecureContext = false;
  assert.equal((await motion.getMotionState()).support, 'insecure');
  assert.equal(await motion.requestMotionPermission(), 'denied');
  window.isSecureContext = true;
  delete window.DeviceMotionEvent;
  assert.equal((await motion.getMotionState()).support, 'unsupported');
  assert.equal(await motion.requestMotionPermission(), 'denied');
  delete global.window;
  assert.equal((await motion.getMotionState()).support, 'unsupported');
});

test('motion converts m/s² to g, ignores invalid/hidden events, and removes its listener', async () => {
  const phone = browser();
  const motion = await loadMotion();
  const samples = [];
  const unsubscribe = motion.subscribeMotion((sample) => samples.push(sample));
  phone.emit(null);
  phone.emit({ x: null, y: 0, z: 9.80665 });
  phone.emit({ x: NaN, y: 0, z: 9.80665 });
  phone.emit({ x: Infinity, y: 0, z: 9.80665 });
  document.visibilityState = 'hidden';
  phone.emit({ x: 0, y: 0, z: 9.80665 });
  assert.equal(samples.length, 0);
  document.visibilityState = 'visible';
  phone.emit({ x: 9.80665, y: -19.6133, z: 0 });
  assert.deepEqual(samples, [{ x: 1, y: -2, z: 0 }]);
  unsubscribe();
  assert.equal(phone.listeners.size, 0);
  phone.emit({ x: 0, y: 0, z: 9.80665 });
  assert.equal(samples.length, 1);
});

test('a phone gesture through the browser bridge activates the detector once', async () => {
  const phone = browser();
  const motion = await loadMotion();
  const detector = createShakeDetector();
  let time = 0;
  let selections = 0;
  const unsubscribe = motion.subscribeMotion((sample) => {
    if (detector.sample(sample, time)) selections++;
  });
  for (const peakTime of [100, 300, 500, 700, 900, 1100]) {
    time = peakTime - 40;
    phone.emit({ x: 0, y: 0, z: 9.80665 });
    time = peakTime;
    phone.emit({ x: 17.65197, y: 0, z: 9.80665 });
  }
  assert.equal(selections, 1);
  unsubscribe();
});
