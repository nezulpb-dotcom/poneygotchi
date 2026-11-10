import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, restoreGame, care, completeQuest, grant, buyOrEquip, advanceDay, decayNeeds, xpThreshold } from '../src/core/game.js';

const date = new Date('2026-11-06T12:00:00');
test('fresh game has all required sections', () => {
  const g = newGame(date);
  assert.equal(g.pet.level, 1);
  assert.equal(g.pet.stars, 30);
  assert.equal(g.inventory[0], 'none');
});
test('feeding updates stats and limits repeated farm rewards', () => {
  const g = newGame(date);
  const first = care(g, 'feed', 100000);
  const stars = g.pet.stars;
  assert.equal(first.ok, true);
  assert.equal(g.pet.hunger, 100);
  care(g, 'feed', 100001);
  assert.equal(g.pet.stars, stars);
});
test('three meals grant a one-time daily bonus', () => {
  const g = newGame(date);
  completeQuest(g, 'morning', date); completeQuest(g, 'noon', date);
  const last = completeQuest(g, 'evening', date);
  assert.deepEqual(last.bonus, { stars: 20, xp: 30 });
  assert.equal(completeQuest(g, 'evening', date).ok, false);
});
test('water rewards are capped but check-ins may continue', () => {
  const g = newGame(date);
  for (let i = 0; i < 5; i++) completeQuest(g, 'water', date);
  assert.equal(g.daily.water, 5);
  assert.equal(g.pet.stars, 30 + 3 * 5);
});
test('day reset prevents yesterday tasks carrying over', () => {
  const g = newGame(date);
  completeQuest(g, 'morning', date);
  advanceDay(g, new Date('2026-11-07T12:00:00'));
  assert.equal(g.daily.meals.morning, false);
});
test('shop enforces cost and level; bought items can be equipped', () => {
  const g = newGame(date);
  assert.equal(buyOrEquip(g, 'bow').ok, true);
  assert.equal(g.pet.stars, 10);
  assert.equal(g.equipped, 'bow');
  assert.equal(buyOrEquip(g, 'flower').reason, 'locked');
});
test('level up awards stars and carries XP over', () => {
  const g = newGame(date);
  grant(g, { xp: xpThreshold(1) + 5 });
  assert.equal(g.pet.level, 2);
  assert.equal(g.pet.xp, 5);
  assert.equal(g.pet.stars, 45);
});
test('needs clamp and save data restore safely', () => {
  const g = newGame(date); decayNeeds(g, 1000);
  assert.equal(g.pet.hunger, 0);
  const restored = restoreGame({ ...g, pet: { ...g.pet, energy: 999 } }, date);
  assert.equal(restored.pet.energy, 100);
});

test('legacy saves gain an empty keepsake album and restored albums stay bounded', () => {
  const legacy = restoreGame({ pet: { level: 2 } }, date);
  assert.deepEqual(legacy.memories, []);
  const valid = (n) => ({ data: 'data:image/jpeg;base64,' + 'a'.repeat(n), capturedAt: '6 nov. 22:00', caption: 'Souvenir' });
  const restored = restoreGame({ memories: [valid(2), valid(3), valid(4), valid(5), valid(6), { ...valid(2), data: 'data:image/jpeg;base64,\" onerror=alert(1)' }] }, date);
  assert.equal(restored.memories.length, 4);
  assert.equal(restored.memories[0].caption, 'Souvenir');
});

test('meadow weather restores to a safe option for new and old saves', () => {
  assert.equal(newGame(date).settings.meadowWeather, 'clear');
  assert.equal(restoreGame({ settings: { meadowWeather: 'drizzle' } }, date).settings.meadowWeather, 'drizzle');
  assert.equal(restoreGame({ settings: { meadowWeather: 'stormy' } }, date).settings.meadowWeather, 'clear');
});
