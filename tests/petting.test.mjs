import test from 'node:test';
import assert from 'node:assert/strict';
import { createPettingState, petRosy } from '../src/core/petting.js';

test('touch position selects a distinct affectionate reaction', () => {
  const forehead = petRosy(createPettingState(), { x: 72, y: 20, width: 144, height: 144 }, 1000);
  assert.equal(forehead.accepted, true);
  assert.equal(forehead.zone, 'forehead');
  assert.equal(forehead.pose, 'look');
  assert.equal(forehead.happiness, 2);

  const cheek = petRosy(forehead.state, { x: 72, y: 70, width: 144, height: 144 }, 1500);
  assert.equal(cheek.zone, 'cheek');
  assert.equal(cheek.pose, 'happy');
  assert.match(cheek.message, /joue/);

  const mane = petRosy(cheek.state, { x: 72, y: 120, width: 144, height: 144 }, 2000);
  assert.equal(mane.zone, 'mane');
  assert.equal(mane.pose, 'play');
  assert.equal(mane.bonus, true);
  assert.match(mane.message, /petit pas de danse/);
});

test('rapid duplicate taps are ignored without changing affection state', () => {
  const first = petRosy(createPettingState(), { y: 70, height: 144 }, 1000);
  const tooSoon = petRosy(first.state, { y: 70, height: 144 }, 1200);
  assert.equal(tooSoon.accepted, false);
  assert.deepEqual(tooSoon.state, first.state);
});

test('repeated zones get a different line and the combo restarts after its dance', () => {
  let state = createPettingState();
  const first = petRosy(state, { y: 20 }, 1000); state = first.state;
  const second = petRosy(state, { y: 20 }, 1500); state = second.state;
  assert.match(second.message, /oreille/);
  const third = petRosy(state, { y: 20 }, 2000); state = third.state;
  assert.equal(third.bonus, true);
  const fourth = petRosy(state, { y: 20 }, 2500);
  assert.equal(fourth.streak, 1);
  assert.equal(fourth.bonus, false);
});

test('a long pause resets the combo and invalid dimensions use a safe target', () => {
  const first = petRosy(createPettingState(), {}, 1000);
  const afterPause = petRosy(first.state, { x: 999, y: 999, width: 0, height: -1 }, 5000);
  assert.equal(afterPause.streak, 1);
  assert.equal(afterPause.x, 144);
  assert.equal(afterPause.y, 144);
  assert.equal(afterPause.zone, 'mane');
});
