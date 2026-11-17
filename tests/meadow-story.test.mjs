import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, meadowMemoryStory } from '../src/core/game.js';

const day = new Date(2026, 10, 17, 12);

test('album stories require a collected valid date', () => {
  const game = newGame(day);
  assert.equal(meadowMemoryStory(game, '2026-11-17'), null);
  game.meadowAlbum = ['2026-11-17', '2026-02-30'];
  assert.equal(meadowMemoryStory(game, '2026-02-30'), null);
  assert.equal(meadowMemoryStory(game, '<script>'), null);
  assert.match(meadowMemoryStory(game, '2026-11-17').text, /Rosy/);
});

test('replaying a memory is deterministic and never changes the save', () => {
  const game = newGame(day);
  game.meadowAlbum = ['2026-11-17', '2026-11-18'];
  const before = JSON.stringify(game);
  const story = meadowMemoryStory(game, '2026-11-17');
  assert.deepEqual(meadowMemoryStory(game, '2026-11-17'), story);
  assert.equal(story.day, '2026-11-17');
  assert.equal(JSON.stringify(game), before);
});
