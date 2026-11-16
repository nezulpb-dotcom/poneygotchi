import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, followFirefly, followPetal } from '../src/core/game.js';
import { renderPanel } from '../src/ui/panels.js';

const date = new Date();

test('the journal explains how to unlock the meadow duet', () => {
  const game = newGame(date);
  const html = renderPanel('missions', game);
  assert.match(html, /Souvenir du pré/);
  assert.match(html, /À composer · jour et nuit/);
  assert.match(html, /Sans étoiles ni XP supplémentaires/);
});

test('the journal celebrates both discoveries without modifying the game', () => {
  const game = newGame(date);
  for (let i = 0; i < 3; i++) followPetal(game, date);
  followFirefly(game, date);
  followFirefly(game, date);
  const before = JSON.stringify(game);
  const html = renderPanel('missions', game);
  assert.match(html, /Pétales et luciole réunis/);
  assert.match(html, /Rosy se souvient du vent/);
  assert.equal(JSON.stringify(game), before);
});
