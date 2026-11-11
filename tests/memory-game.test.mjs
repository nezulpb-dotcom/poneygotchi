import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryRound, revealMemoryCard, recordMemoryWin } from '../src/core/memory-game.js';
import { newGame, advanceDay } from '../src/core/game.js';

const date = new Date('2026-11-11T12:00:00');

test('round contains three complete pairs and unique card ids', () => {
  const round = createMemoryRound(() => 0);
  assert.equal(round.cards.length, 6);
  assert.equal(new Set(round.cards.map((card) => card.id)).size, 6);
  for (const symbol of ['🌸', '🌼', '🍀']) {
    assert.equal(round.cards.filter((card) => card.symbol === symbol).length, 2);
  }
});

test('first pick reveals one card and matching pick locks the pair', () => {
  let round = createMemoryRound(() => 0);
  const first = 0;
  const mate = round.cards.findIndex((card, index) => index !== first && card.symbol === round.cards[first].symbol);
  let step = revealMemoryCard(round, first);
  assert.equal(step.result, 'first');
  assert.equal(step.round.cards[first].revealed, true);
  step = revealMemoryCard(step.round, mate);
  assert.equal(step.result, 'match');
  assert.equal(step.round.cards[first].matched, true);
  assert.equal(step.round.cards[mate].matched, true);
  assert.equal(step.round.matches, 1);
  assert.equal(revealMemoryCard(step.round, first).result, 'ignored');
});

test('a mismatch remains visible until the next selection, then hides safely', () => {
  let round = createMemoryRound(() => 0);
  const first = 0;
  const other = round.cards.findIndex((card, index) => index !== first && card.symbol !== round.cards[first].symbol);
  round = revealMemoryCard(round, first).round;
  const mismatch = revealMemoryCard(round, other);
  assert.equal(mismatch.result, 'mismatch');
  assert.deepEqual(mismatch.round.pendingHide, [first, other]);
  assert.equal(mismatch.round.cards[first].revealed, true);
  const nextIndex = round.cards.findIndex((card, index) => index !== first && index !== other);
  const next = revealMemoryCard(mismatch.round, nextIndex);
  assert.equal(next.round.cards[first].revealed, false);
  assert.equal(next.round.cards[other].revealed, false);
  assert.equal(next.round.cards[nextIndex].revealed, true);
});

test('three pairs complete the round without a timer', () => {
  let round = createMemoryRound(() => 0);
  let lastResult = '';
  for (const symbol of ['🌸', '🌼', '🍀']) {
    const pair = round.cards.map((card, index) => ({ card, index })).filter(({ card }) => card.symbol === symbol);
    let step = revealMemoryCard(round, pair[0].index);
    round = step.round;
    step = revealMemoryCard(round, pair[1].index);
    round = step.round;
    lastResult = step.result;
  }
  assert.equal(lastResult, 'complete');
  assert.equal(round.finished, true);
  assert.equal(round.matches, 3);
  assert.equal(round.moves, 3);
  assert.equal(revealMemoryCard(round, 0).result, 'ignored');
});

test('daily reward is granted once and resets with the local day', () => {
  const game = newGame(date);
  const awards = [];
  const first = recordMemoryWin(game.daily, (reward) => awards.push(reward));
  const second = recordMemoryWin(game.daily, (reward) => awards.push(reward));
  assert.equal(first.rewarded, true);
  assert.deepEqual(first.reward, { stars: 12, xp: 15 });
  assert.equal(second.rewarded, false);
  assert.equal(awards.length, 1);
  advanceDay(game, new Date('2026-11-12T00:01:00'));
  assert.equal(game.daily.memoryRewarded, false);
  const nextDay = recordMemoryWin(game.daily, (reward) => awards.push(reward));
  assert.equal(nextDay.rewarded, true);
  assert.equal(awards.length, 2);
});
