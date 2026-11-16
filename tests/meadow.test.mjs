import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, restoreGame, followFirefly, followPetal, meadowDuet } from '../src/core/game.js';

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

test('an unfinished trail survives save restoration and can be completed', () => {
  const game = newGame(firstNight);
  followFirefly(game, firstNight);
  const restored = restoreGame(JSON.parse(JSON.stringify(game)), firstNight);
  assert.equal(restored.daily.fireflyStep, 1);
  assert.equal(restored.daily.fireflyFound, false);
  assert.equal(followFirefly(restored, firstNight).found, true);
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


test('a fresh day starts with no followed petals', () => {
  const game = newGame(firstNight);
  assert.equal(game.daily.petalsFollowed, 0);
});

test('three petal touches complete a gentle daily trail without rewards', () => {
  const game = newGame(firstNight);
  const before = { stars: game.pet.stars, xp: game.pet.xp };
  assert.deepEqual(followPetal(game, firstNight), { ok: true, step: 1, complete: false, day: game.daily.date });
  assert.deepEqual(followPetal(game, firstNight), { ok: true, step: 2, complete: false, day: game.daily.date });
  assert.deepEqual(followPetal(game, firstNight), { ok: true, step: 3, complete: true, day: game.daily.date });
  assert.equal(game.daily.petalsFollowed, 3);
  assert.deepEqual({ stars: game.pet.stars, xp: game.pet.xp }, before);
  assert.deepEqual(followPetal(game, firstNight), { ok: false, reason: 'complete', step: 3 });
});

test('petal progress resets on the next local day', () => {
  const game = newGame(firstNight);
  followPetal(game, firstNight);
  followPetal(game, firstNight);
  const result = followPetal(game, nextMorning);
  assert.deepEqual(result, { ok: true, step: 1, complete: false, day: '2026-11-16' });
  assert.equal(game.daily.petalsFollowed, 1);
});

test('partial petal progress survives restoration and older saves default safely', () => {
  const game = newGame(firstNight);
  followPetal(game, firstNight);
  const restored = restoreGame(JSON.parse(JSON.stringify(game)), firstNight);
  assert.equal(restored.daily.petalsFollowed, 1);
  assert.equal(followPetal(restored, firstNight).step, 2);

  const legacy = newGame(firstNight);
  delete legacy.daily.petalsFollowed;
  assert.equal(restoreGame(legacy, firstNight).daily.petalsFollowed, 0);
});

test('malformed petal progress is clamped to the supported range', () => {
  const game = newGame(firstNight);
  game.daily.petalsFollowed = 99;
  assert.equal(restoreGame(game, firstNight).daily.petalsFollowed, 3);
  game.daily.petalsFollowed = -4;
  assert.equal(restoreGame(game, firstNight).daily.petalsFollowed, 0);
});


test('the meadow duet unlocks only after both day and night discoveries', () => {
  const game = newGame(firstNight);
  assert.deepEqual(meadowDuet(game, firstNight), { petals: 0, firefly: false, complete: false });
  for (let i = 0; i < 3; i++) followPetal(game, firstNight);
  assert.deepEqual(meadowDuet(game, firstNight), { petals: 3, firefly: false, complete: false });
  followFirefly(game, firstNight);
  assert.equal(meadowDuet(game, firstNight).complete, false);
  followFirefly(game, firstNight);
  assert.deepEqual(meadowDuet(game, firstNight), { petals: 3, firefly: true, complete: true });
  assert.equal(meadowDuet(game, nextMorning).complete, false);
  assert.equal(meadowDuet(game, firstNight).complete, true);
});

test('the duet is read-only and survives restoration without extra rewards', () => {
  const game = newGame(firstNight);
  for (let i = 0; i < 3; i++) followPetal(game, firstNight);
  followFirefly(game, firstNight);
  followFirefly(game, firstNight);
  const before = JSON.stringify(game);
  assert.equal(meadowDuet(game, firstNight).complete, true);
  assert.equal(JSON.stringify(game), before);
  const restored = restoreGame(JSON.parse(before), firstNight);
  assert.equal(meadowDuet(restored, firstNight).complete, true);
  assert.equal(restored.pet.stars, game.pet.stars);
  assert.equal(restored.pet.xp, game.pet.xp);
});
