import test from 'node:test';
import assert from 'node:assert/strict';
import { PonyAnimator, chooseAutonomousHabit } from '../src/graphics/pony.js';

// Lightweight browser adapters keep animation timing deterministic.
globalThis.Image = class { src = ''; };
const motion = { matches: false };
globalThis.window = { matchMedia: () => motion };
const hit = { style: {} };
globalThis.document = { getElementById: () => hit };
const healthy = { hunger: 80, happiness: 80, hygiene: 80, energy: 80 };
function animator(onHabit = null) {
 const wrap = { style: {}, dataset: {}, offsetTop: 232 };
 const el = { style: {}, src: '', closest: () => wrap };
 return new PonyAnimator(el, onHabit);
}
test('walking stays within the meadow and touch target follows Rosy', () => {
 const pony = animator(); pony.state = 'walk'; pony.x = 157;
 pony.update(1, 100, healthy);
 assert.equal(pony.x, 158);
 assert.equal(pony.direction, -1);
 assert.equal(hit.style.left, '158px');
 assert.equal(hit.style.top, '232px');
});
test('looking and playing use existing expressive sprites', () => {
 const pony = animator(); pony.state = 'look'; pony.frame = 2;
 pony.update(0, 100, healthy);
 assert.match(pony.el.src, /blink_02/);
 pony.state = 'play';
 pony.update(0, 200, healthy);
 assert.match(pony.el.src, /happy_02/);
 assert.notEqual(pony.el.style.transform, 'translateY(0px) rotate(0deg)');
});
test('sleep action holds its pose and reduced motion stops walking and bouncing', () => {
 const pony = animator(); pony.action('sleep', 3000);
 pony.update(.1, performance.now(), healthy);
 assert.equal(pony.state, 'sleep');
 motion.matches = true;
 try {
  pony.actionUntil = 0; pony.state = 'walk';
  const x = pony.x;
  pony.update(.1, 100, healthy);
  assert.equal(pony.x, x);
  assert.match(pony.el.src, /walk_00/);
  pony.state = 'play'; pony.update(.1, 200, healthy);
  assert.equal(pony.el.style.transform, 'translateY(0px) rotate(0deg)');
 } finally { motion.matches = false; }
});
test('autonomous habits are varied and reuse available sprite sheets', () => {
 assert.equal(chooseAutonomousHabit(() => 0).state, 'sniff');
 assert.equal(chooseAutonomousHabit(() => .99).state, 'play');
 const events = [];
 const pony = animator((habit) => events.push(habit));
 const originalRandom = Math.random;
 try {
  Math.random = () => 0;
  pony.behaviorDuration = 0;
  pony.update(.01, 100, healthy);
 } finally {
  Math.random = originalRandom;
 }
 assert.equal(pony.state, 'sniff');
 assert.equal(pony.wrap.dataset.pose, 'sniff');
 assert.match(pony.el.src, /eat_00/);
 assert.equal(events.length, 1);
 assert.match(events[0].message, /renifle/);
});
