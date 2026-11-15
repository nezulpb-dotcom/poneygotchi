import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createState, normalizeState, completeQuest, concertReady, launchConcert,
  loadState, saveState, STORAGE_KEY,
} from './game.js';

const today = new Date('2026-11-15T12:00:00');
const tomorrow = new Date('2026-11-16T12:00:00');

test('a fresh day starts with empty gauges and six daily missions', async () => {
  const { QUESTS } = await import('./game.js');
  assert.equal(QUESTS.length, 6);
  assert.deepEqual(createState(today).stats, { moral: 0, music: 0, inspiration: 0 });
});

test('each mission can be claimed only once per day', () => {
  let state = createState(today);
  const first = completeQuest(state, 'water', today);
  state = first.state;
  assert.equal(first.ok, true);
  assert.equal(state.stats.moral, 25);
  assert.equal(completeQuest(state, 'water', today).reason, 'already-completed');
});

test('the daily-life missions unlock a concert after all three gauges fill', () => {
  let state = createState(today);
  for (const id of ['water', 'friends', 'rhythm', 'playlist', 'ideas', 'pause']) {
    state = completeQuest(state, id, today).state;
  }
  assert.equal(concertReady(state), false); // each gauge is 50 after two quests? all six = 50
  for (const id of ['water', 'friends', 'rhythm', 'playlist', 'ideas', 'pause']) {
    state = completeQuest(state, id, tomorrow).state;
  }
  assert.equal(concertReady(state), true);
  const show = launchConcert(state);
  assert.equal(show.ok, true);
  assert.equal(show.state.concerts, 1);
});

test('new day refreshes missions without erasing long-term gauge progress', () => {
  let state = createState(today);
  state = completeQuest(state, 'water', today).state;
  const next = normalizeState(state, tomorrow);
  assert.deepEqual(next.completed, []);
  assert.equal(next.stats.moral, 25);
});

test('invalid saved values are clamped and unknown missions discarded', () => {
  const state = normalizeState({
    date: '2026-11-15', completed: ['water', 'hacked'],
    stats: { moral: 900, music: -5, inspiration: 'NaN' }, concerts: -1,
  }, today);
  assert.deepEqual(state.completed, ['water']);
  assert.deepEqual(state.stats, { moral: 100, music: 0, inspiration: 0 });
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
