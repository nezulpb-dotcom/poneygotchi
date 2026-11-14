import test from 'node:test';
import assert from 'node:assert/strict';
import { memoryReaction } from '../src/core/memory-reactions.js';

const healthy = { energy: 80, happiness: 80 };

test('a normal match keeps the familiar happy response and later pairs vary', () => {
  const first = memoryReaction('match', healthy, 0);
  const second = memoryReaction('match', healthy, 1);
  assert.equal(first.pose, 'happy');
  assert.equal(first.message, 'Deux fleurs pareilles ! Rosy est ravie. 🌸');
  assert.notEqual(second.message, first.message);
});

test('low-energy Rosy celebrates a match and a win more softly', () => {
  const match = memoryReaction('match', { energy: 20, happiness: 80 });
  const complete = memoryReaction('complete', { energy: 20, happiness: 80 });
  assert.equal(match.pose, 'happy');
  assert.match(match.message, /Tout doucement/);
  assert.equal(complete.pose, 'happy');
  assert.match(complete.message, /tout doucement/);
  assert.ok(complete.duration < 2400);
});

test('low-happiness Rosy stays encouraging after a mismatch and celebrates success', () => {
  const mismatch = memoryReaction('mismatch', { energy: 80, happiness: 15 });
  const complete = memoryReaction('complete', { energy: 80, happiness: 15 });
  assert.match(mismatch.message, /Ce n’est pas grave/);
  assert.match(complete.message, /est fière/);
});

test('energetic Rosy uses a lively victory pose and a quiet hint remains available', () => {
  const complete = memoryReaction('complete', healthy);
  const hint = memoryReaction('hint', healthy);
  assert.equal(complete.pose, 'play');
  assert.equal(complete.duration, 2400);
  assert.equal(hint.pose, 'look');
  assert.match(hint.message, /montre deux fleurs/);
});

test('invalid needs are safely normalized and unknown outcomes do nothing', () => {
  const fallback = memoryReaction('match', { energy: Number.NaN, happiness: null });
  assert.equal(fallback.message, 'Deux fleurs pareilles ! Rosy est ravie. 🌸');
  assert.equal(memoryReaction('unknown', healthy), null);
});
