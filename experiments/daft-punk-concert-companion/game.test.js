import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, normalizeState, completeQuest, awardMiniGame, concertReady, launchConcert, QUESTS } from './game.js';

test('daily quests are unique and bounded', () => {
  let state = createState(new Date('2026-11-15T12:00:00'));
  const first = completeQuest(state, 'water', new Date('2026-11-15T12:00:00'));
  assert.equal(first.ok, true);
  assert.equal(first.state.stats.moral, 25);
  assert.equal(completeQuest(first.state, 'water', new Date('2026-11-15T12:00:00')).ok, false);
  assert.equal(completeQuest(first.state, 'unknown', new Date('2026-11-15T12:00:00')).ok, false);
});

test('all three concert gauges can reach 100 with the daily content', () => {
  let state = createState();
  for (const id of ['water', 'meal', 'move', 'pause', 'listen', 'idea', 'tidy']) {
    state = completeQuest(state, id).state;
  }
  state = awardMiniGame(state, 'beat', 'music', 40).state;
  state = awardMiniGame(state, 'memory', 'music', 30).state;
  state = awardMiniGame(state, 'mix', 'inspiration', 30).state;
  assert.deepEqual(state.stats, { moral: 100, music: 100, inspiration: 100 });
  assert.equal(concertReady(state), true);
  const show = launchConcert(state);
  assert.equal(show.ok, true);
  assert.equal(show.state.concerts, 1);
});

test('concert progression and theme survive a new day', () => {
  const old = { ...createState(), concerts: 2, theme: 'tron' };
  const next = normalizeState(old, new Date('2026-11-16T12:00:00'));
  assert.equal(next.concerts, 2);
  assert.equal(next.theme, 'tron');
  assert.deepEqual(next.completed, []);
  assert.deepEqual(next.wins, []);
});

test('unknown themes are normalized safely', () => {
  assert.equal(normalizeState({ theme: 'not-a-theme' }).theme, 'alive');
  assert.equal(QUESTS.some(q => q.id === 'listen' && q.stat === 'music'), true);
});
