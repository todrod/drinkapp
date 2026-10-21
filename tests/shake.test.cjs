const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createShakeDetector } = require('../src/logic/shake.ts');

const rest = { x: 0, y: 0, z: 1 };
const jolt = { x: 1.8, y: 0, z: 1 };
function peak(detector, time) {
  detector.sample(rest, time - 40);
  return detector.sample(jolt, time);
}

test('rest, rotation, and a sustained bump do not choose a drink', () => {
  const detector = createShakeDetector();
  for (let time = 0; time < 1000; time += 80) {
    const angle = time / 100;
    assert.equal(detector.sample({ x: Math.sin(angle), y: 0, z: Math.cos(angle) }, time), false);
  }
  for (let time = 1000; time < 2000; time += 80) {
    assert.equal(detector.sample(jolt, time), false);
  }
});

test('three distinct jolts in a short window choose once', () => {
  const detector = createShakeDetector();
  assert.equal(peak(detector, 100), false);
  assert.equal(peak(detector, 300), false);
  assert.equal(peak(detector, 500), true);
  assert.equal(peak(detector, 700), false);
  assert.equal(peak(detector, 900), false);
  assert.equal(peak(detector, 1100), false);
  assert.equal(peak(detector, 2400), false);
  assert.equal(peak(detector, 2600), false);
  assert.equal(peak(detector, 2800), true);
});

test('isolated bumps expire, so walking or setting the phone down does not accumulate', () => {
  const detector = createShakeDetector();
  for (let time = 100; time < 5000; time += 600) assert.equal(peak(detector, time), false);
});

test('invalid readings are ignored, and restarting clears partial gestures', () => {
  const detector = createShakeDetector();
  assert.equal(detector.sample({ x: NaN, y: 0, z: 1 }, 0), false);
  assert.equal(detector.sample({ x: Infinity, y: 0, z: 1 }, 0), false);
  assert.equal(detector.sample(jolt, NaN), false);
  peak(detector, 100);
  peak(detector, 300);
  detector.reset();
  assert.equal(peak(detector, 500), false);
  assert.equal(peak(detector, 700), false);
  assert.equal(peak(detector, 900), true);
});
