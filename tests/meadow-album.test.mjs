import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, restoreGame, followPetal, followFirefly, collectMeadowMemory } from '../src/core/game.js';

const day = new Date(2026, 10, 17, 12);
const next = new Date(2026, 10, 18, 12);

test('meadow album unlocks only after both discoveries, once per day', () => {
  const game = newGame(day);
  for (let i = 0; i < 3; i++) followPetal(game, day);
  assert.equal(collectMeadowMemory(game, day).collected, false);
  followFirefly(game, day);
  followFirefly(game, day);
  assert.equal(collectMeadowMemory(game, day).collected, true);
  assert.equal(collectMeadowMemory(game, day).collected, false);
  assert.deepEqual(game.meadowAlbum, ['2026-11-17']);
});

test('album survives daily rollover and restore without modifying old saves', () => {
  const game = newGame(day);
  for (let i = 0; i < 3; i++) followPetal(game, day);
  followFirefly(game, day);
  followFirefly(game, day);
  collectMeadowMemory(game, day);
  const restored = restoreGame(JSON.parse(JSON.stringify(game)), next);
  assert.deepEqual(restored.meadowAlbum, ['2026-11-17']);
  assert.equal(restored.daily.petalsFollowed, 0);
  assert.deepEqual(restoreGame({ pet: game.pet }, next).meadowAlbum, []);
});

test('album sanitizes duplicates and invalid values and remains bounded', () => {
  const game = restoreGame({ meadowAlbum: [null, 'bad', '2026-11-17', '2026-11-17', ...Array.from({length: 35}, (_, i) => '2026-10-' + String(i + 1).padStart(2, '0'))] }, day);
  assert.equal(game.meadowAlbum.length, 30);
  assert.equal(new Set(game.meadowAlbum).size, 30);
});
