import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryRound, revealMemoryCard, revealMemoryHint, clearMemoryHint, recordMemoryWin } from '../src/core/memory-game.js';
import { newGame, advanceDay } from '../src/core/game.js';

const date = new Date('2026-11-11T12:00:00');
const FLOWERS = ['🌸', '🌼', '🍀', '🌷'];

test('default round contains three complete pairs and unique card ids', () => {
  const round = createMemoryRound(() => 0);
  assert.equal(round.pairCount, 3);
  assert.equal(round.cards.length, 6);
  assert.equal(new Set(round.cards.map((card) => card.id)).size, 6);
  for (const symbol of FLOWERS.slice(0, 3)) {
    assert.equal(round.cards.filter((card) => card.symbol === symbol).length, 2);
  }
});

test('flower meadow mode contains four complete pairs', () => {
  const round = createMemoryRound(() => 0, 4);
  assert.equal(round.pairCount, 4);
  assert.equal(round.cards.length, 8);
  assert.equal(new Set(round.cards.map((card) => card.id)).size, 8);
  for (const symbol of FLOWERS) {
    assert.equal(round.cards.filter((card) => card.symbol === symbol).length, 2);
  }
});

test('unsupported difficulty safely falls back to the three-pair garden', () => {
  const round = createMemoryRound(() => 0, 99);
  assert.equal(round.pairCount, 3);
  assert.equal(round.cards.length, 6);
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

test('three pairs complete the default round without a timer', () => {
  let round = createMemoryRound(() => 0);
  let lastResult = '';
  for (const symbol of FLOWERS.slice(0, 3)) {
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

test('four pairs complete the larger round only on the final match', () => {
  let round = createMemoryRound(() => 0, 4);
  let lastResult = '';
  for (const symbol of FLOWERS) {
    const pair = round.cards.map((card, index) => ({ card, index })).filter(({ card }) => card.symbol === symbol);
    let step = revealMemoryCard(round, pair[0].index);
    round = step.round;
    step = revealMemoryCard(round, pair[1].index);
    round = step.round;
    lastResult = step.result;
    if (symbol !== FLOWERS[FLOWERS.length - 1]) assert.equal(round.finished, false);
  }
  assert.equal(lastResult, 'complete');
  assert.equal(round.finished, true);
  assert.equal(round.matches, 4);
  assert.equal(round.moves, 4);
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

test('Rosy hint reveals one intact pair without adding a move', () => {
  const round = createMemoryRound(() => 0, 4);
  const hint = revealMemoryHint(round, () => 0);
  assert.equal(hint.result, 'hint');
  assert.equal(hint.round.hintsUsed, 1);
  assert.equal(hint.round.moves, 0);
  assert.equal(hint.round.firstCard, null);
  assert.equal(hint.round.hintedPair.length, 2);
  const [first, second] = hint.round.hintedPair;
  assert.equal(hint.round.cards[first].symbol, hint.round.cards[second].symbol);
  assert.deepEqual(clearMemoryHint(hint.round).hintedPair, []);
});

test('Rosy hints are unavailable during a turn and stop after two per round', () => {
  let round = createMemoryRound(() => 0, 4);
  round = revealMemoryCard(round, 0).round;
  assert.equal(revealMemoryHint(round, () => 0).result, 'ignored');
  round = createMemoryRound(() => 0, 4);
  for (let use = 0; use < 2; use++) {
    const hint = revealMemoryHint(round, () => 0);
    assert.equal(hint.result, 'hint');
    round = clearMemoryHint(hint.round);
  }
  assert.equal(round.hintsUsed, 2);
  assert.equal(revealMemoryHint(round, () => 0).result, 'ignored');
});

test('choosing a flower shown by Rosy consumes the hint and starts a normal turn', () => {
  const round = createMemoryRound(() => 0, 4);
  const hint = revealMemoryHint(round, () => 0);
  const chosen = hint.round.hintedPair[0];
  const step = revealMemoryCard(hint.round, chosen);
  assert.equal(step.result, 'first');
  assert.equal(step.round.firstCard, chosen);
  assert.equal(step.round.cards[chosen].revealed, true);
  assert.deepEqual(step.round.hintedPair, []);
  assert.equal(step.round.moves, 0);
});
