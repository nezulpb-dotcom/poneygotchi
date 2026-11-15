import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, restoreGame, discoverFirefly } from '../src/core/game.js';

const firstNight = new Date(2026, 10, 15, 22, 0, 0);
const nextMorning = new Date(2026, 10, 16, 7, 0, 0);

test('a fresh day has no recorded firefly discovery', () => {
  const game = newGame(firstNight);
  assert.equal(game.daily.fireflyFound, false);
});

test('the evening firefly is recorded once without changing rewards', () => {
  const game = newGame(firstNight);
  const before = { stars: game.pet.stars, xp: game.pet.xp };
  assert.deepEqual(discoverFirefly(game, firstNight), { ok: true, day: game.daily.date });
  assert.equal(game.daily.fireflyFound, true);
  assert.deepEqual({ stars: game.pet.stars, xp: game.pet.xp }, before);
  assert.deepEqual(discoverFirefly(game, firstNight), { ok: false, reason: 'already-found' });
});

test('a new local day offers a fresh firefly discovery', () => {
  const game = newGame(firstNight);
  discoverFirefly(game, firstNight);
  const result = discoverFirefly(game, nextMorning);
  assert.equal(result.ok, true);
  assert.equal(game.daily.date, '2026-11-16');
  assert.equal(game.daily.fireflyFound, true);
});

test('older saves receive a safe default for the new daily field', () => {
  const legacy = newGame(firstNight);
  delete legacy.daily.fireflyFound;
  const restored = restoreGame(legacy, firstNight);
  assert.equal(restored.daily.fireflyFound, false);
});
