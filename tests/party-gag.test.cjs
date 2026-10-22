const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PARTY_GAG_DURATION_MS, partyGagSecondsLeft, pickPartyGagResult } = require('../src/logic/partyGag.ts');

test('the pretend countdown runs for four seconds and never finishes early', () => {
  assert.equal(PARTY_GAG_DURATION_MS, 4_000);
  const deadline = 14_000;
  assert.deepEqual([10_000, 10_999, 11_000, 12_000, 13_999, 14_000, 20_000].map((now) => partyGagSecondsLeft(deadline, now)), [4, 4, 3, 2, 1, 0, 0]);
  assert.equal(partyGagSecondsLeft(deadline, 0), 4);
});

test('every integer nonsense score from 0 to 100 is reachable', () => {
  const results = Array.from({ length: 101 }, (_, score) => pickPartyGagResult((score + 0.5) / 101));
  assert.deepEqual(results.map((result) => result.score), Array.from({ length: 101 }, (_, i) => i));
  assert.equal(new Set(results.map((result) => result.title)).size, 6);
  assert.ok(results.every((result) => result.title && result.detail));
});

test('endpoint and invalid random samples cannot produce an out-of-range or missing result', () => {
  for (const sample of [-1, 0, 1, 2, NaN, Infinity, -Infinity]) {
    const result = pickPartyGagResult(sample);
    assert.ok(Number.isInteger(result.score) && result.score >= 0 && result.score <= 100);
    assert.equal(typeof result.title, 'string');
  }
});
