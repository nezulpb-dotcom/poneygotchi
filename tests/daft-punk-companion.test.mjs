import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, normalizeState, completeQuest, awardMiniGame, concertReady, launchConcert, loadState, saveState, STORAGE_KEY } from '../experiments/daft-punk-concert-companion/game.js';

const today = new Date('2026-11-15T12:00:00');
const tomorrow = new Date('2026-11-16T12:00:00');

test('fresh state has empty gauges and a clean mix console', () => {
  const state = createState(today);
  assert.deepEqual(state.stats, { moral: 0, music: 0, inspiration: 0 });
  assert.deepEqual(state.mix, { bass: 1, lead: 1, beat: 1 });
});

test('a daily-life mission can only be claimed once per day', () => {
  let state = createState(today);
  const first = completeQuest(state, 'water', today);
  state = first.state;
  assert.equal(first.ok, true);
  assert.equal(state.stats.moral, 20);
  assert.equal(completeQuest(state, 'water', today).reason, 'already-completed');
});

test('mini-games award their gauge once and clamp progress at 100', () => {
  let state = createState(today);
  state = awardMiniGame(state, 'beat', 'music', 40, today).state;
  assert.equal(awardMiniGame(state, 'beat', 'music', 40, today).reason, 'already-won');
  state.stats.music = 90;
  state = awardMiniGame(state, 'memory', 'music', 30, today).state;
  assert.equal(state.stats.music, 100);
});

test('missions and mini-games across two days unlock the concert', () => {
  let state = createState(today);
  for (const id of ['water', 'meal', 'move', 'pause']) state = completeQuest(state, id, today).state;
  state = completeQuest(state, 'idea', today).state;
  state = completeQuest(state, 'tidy', today).state;
  state = awardMiniGame(state, 'beat', 'music', 40, today).state;
  state = awardMiniGame(state, 'memory', 'music', 30, today).state;
  assert.equal(concertReady(state), false);
  for (const id of ['water', 'meal', 'move', 'pause']) state = completeQuest(state, id, tomorrow).state;
  state = completeQuest(state, 'idea', tomorrow).state;
  state = completeQuest(state, 'tidy', tomorrow).state;
  state = awardMiniGame(state, 'beat', 'music', 40, tomorrow).state;
  state = awardMiniGame(state, 'memory', 'music', 30, tomorrow).state;
  state.stats.music = 100;
  assert.equal(concertReady(state), true);
  const show = launchConcert(state);
  assert.equal(show.ok, true);
  assert.equal(show.state.concerts, 1);
});

test('a new day refreshes daily actions but preserves long-term gauges', () => {
  let state = completeQuest(createState(today), 'water', today).state;
  state = awardMiniGame(state, 'beat', 'music', 40, today).state;
  const next = normalizeState(state, tomorrow);
  assert.deepEqual(next.completed, []);
  assert.deepEqual(next.wins, []);
  assert.equal(next.stats.moral, 20);
  assert.equal(next.stats.music, 40);
});

test('saved values are sanitized and unknown mission IDs discarded', () => {
  const state = normalizeState({
    date: '2026-11-15', completed: ['water', 'hacked'], wins: ['beat', 'bad'],
    stats: { moral: 900, music: -5, inspiration: 'NaN' }, concerts: -1,
    mix: { bass: 99, lead: 0, beat: 2 },
  }, today);
  assert.deepEqual(state.completed, ['water']);
  assert.deepEqual(state.wins, ['beat']);
  assert.deepEqual(state.stats, { moral: 100, music: 0, inspiration: 0 });
  assert.deepEqual(state.mix, { bass: 3, lead: 1, beat: 2 });
  assert.equal(state.concerts, 0);
});

test('storage failures do not crash the game', () => {
  const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(loadState(broken, today).date, '2026-11-15');
  assert.equal(saveState(createState(today), broken), false);
  const memory = new Map();
  const storage = { getItem: (key) => memory.get(key), setItem: (key, value) => memory.set(key, value) };
  assert.equal(saveState(createState(today), storage), true);
  assert.ok(memory.has(STORAGE_KEY));
});
