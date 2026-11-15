import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, restoreGame, followFirefly } from '../src/core/game.js';

const firstNight = new Date(2026, 10, 15, 22, 0, 0);
const nextMorning = new Date(2026, 10, 16, 7, 0, 0);

test('a fresh day starts with an untouched firefly trail', () => {
  const game = newGame(firstNight);
  assert.equal(game.daily.fireflyStep, 0);
  assert.equal(game.daily.fireflyFound, false);
});

test('two touches follow the firefly without changing rewards', () => {
  const game = newGame(firstNight);
  const before = { stars: game.pet.stars, xp: game.pet.xp };
  assert.deepEqual(followFirefly(game, firstNight), { ok: true, step: 1, found: false, day: game.daily.date });
  assert.equal(game.daily.fireflyFound, false);
  assert.deepEqual({ stars: game.pet.stars, xp: game.pet.xp }, before);
  assert.deepEqual(followFirefly(game, firstNight), { ok: true, step: 2, found: true, day: game.daily.date });
  assert.equal(game.daily.fireflyFound, true);
  assert.deepEqual({ stars: game.pet.stars, xp: game.pet.xp }, before);
  assert.deepEqual(followFirefly(game, firstNight), { ok: false, reason: 'already-found', step: 2 });
});

test('a new local day offers a fresh two-touch trail', () => {
  const game = newGame(firstNight);
  followFirefly(game, firstNight);
  const result = followFirefly(game, nextMorning);
  assert.deepEqual(result, { ok: true, step: 1, found: false, day: '2026-11-16' });
  assert.equal(game.daily.fireflyStep, 1);
  assert.equal(game.daily.fireflyFound, false);
});

test('older saves receive safe defaults for the trail fields', () => {
  const legacy = newGame(firstNight);
  delete legacy.daily.fireflyFound;
  delete legacy.daily.fireflyStep;
  const restored = restoreGame(legacy, firstNight);
  assert.equal(restored.daily.fireflyStep, 0);
  assert.equal(restored.daily.fireflyFound, false);
});

test('malformed trail progress is clamped and a completed trail stays complete', () => {
  const legacy = newGame(firstNight);
  legacy.daily.fireflyStep = 99;
  const restored = restoreGame(legacy, firstNight);
  assert.equal(restored.daily.fireflyStep, 2);
  assert.equal(restored.daily.fireflyFound, true);
});
