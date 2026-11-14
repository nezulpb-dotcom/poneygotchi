const STATES = ['idle', 'walk', 'blink', 'happy', 'eat', 'sleep', 'sad', 'wash'];

const AUTONOMOUS_HABITS = [
  { state: 'sniff', message: 'Rosy renifle une petite touffe d’herbe…', speak: true, min: 4.5, max: 7 },
  { state: 'curious', message: 'Oh ? Quelque chose a bougé dans les fleurs !', speak: true, min: 3.5, max: 6 },
  { state: 'stretch', message: 'Rosy s’étire avec un petit frisson de bonheur.', speak: false, min: 4, max: 6 },
  { state: 'groom', message: 'Rosy remet doucement sa crinière en place.', speak: false, min: 4, max: 6.5 },
  { state: 'doze', message: 'Une toute petite pause les yeux fermés…', speak: true, min: 3.5, max: 5.5 },
  { state: 'walk', message: 'Rosy part explorer un autre coin de la prairie.', speak: false, min: 5, max: 8 },
  { state: 'idle', message: 'Rosy profite tranquillement du paysage.', speak: false, min: 4.5, max: 7 },
  { state: 'play', message: 'Rosy fait un petit pas de danse !', speak: true, min: 3.5, max: 5.5 },
];

function habitWeight(habit, pet) {
  let weight = 1;
  const energy = Number(pet?.energy);
  const happiness = Number(pet?.happiness);
  const hunger = Number(pet?.hunger);
  const hygiene = Number(pet?.hygiene);

  if (Number.isFinite(energy)) {
    if (energy < 35) {
      const tired = { doze: 3.4, idle: 1.6, groom: 1.4, stretch: 1.3, walk: 0.35, play: 0.25 };
      weight *= tired[habit.state] ?? 1;
    } else if (energy > 70) {
      const lively = { play: 1.8, walk: 1.6, curious: 1.3, stretch: 1.3, doze: 0.45, idle: 0.75 };
      weight *= lively[habit.state] ?? 1;
    }
  }
  if (Number.isFinite(happiness)) {
    if (happiness < 35) {
      const gentle = { curious: 1.5, sniff: 1.4, groom: 1.1, play: 0.55, walk: 0.75 };
      weight *= gentle[habit.state] ?? 1;
    } else if (happiness > 75) {
      const cheerful = { play: 1.5, walk: 1.25, curious: 1.2, stretch: 1.2, doze: 0.65 };
      weight *= cheerful[habit.state] ?? 1;
    }
  }
  if (Number.isFinite(hunger) && hunger < 35) {
    const hungry = { sniff: 2.2, curious: 1.3, play: 0.6, walk: 0.7 };
    weight *= hungry[habit.state] ?? 1;
  }
  if (Number.isFinite(hygiene) && hygiene < 35 && habit.state === 'groom') weight *= 1.8;

  return Math.max(0.15, weight);
}

export function chooseAutonomousHabit(random = Math.random, previousState = null, pet = null) {
  const choices = previousState
    ? AUTONOMOUS_HABITS.filter((habit) => habit.state !== previousState)
    : AUTONOMOUS_HABITS;
  const weighted = choices.map((habit) => ({ habit, weight: habitWeight(habit, pet) }));
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  const sample = Number(random());
  let cursor = (Number.isFinite(sample) ? Math.max(0, Math.min(0.999999, sample)) : 0) * total;
  for (const entry of weighted) {
    cursor -= entry.weight;
    if (cursor < 0) return { ...entry.habit };
  }
  return { ...weighted[weighted.length - 1].habit };
}

export class PonyAnimator {
  constructor(el, onHabit = null) {
    this.el = el;
    this.wrap = el.closest('.pony-wrap');
    this.onHabit = onHabit;
    this.lastHabitState = null;
    this.state = 'idle';
    this.direction = 1;
    this.x = 90;
    this.elapsed = 0;
    this.behaviorElapsed = 0;
    this.blinkIn = 5 + Math.random() * 2.5;
    this.blinkRemaining = 0;
    this.frame = 0;
    this.actionUntil = 0;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.behaviorDuration = 5;
    this.loaded = new Map();
    for (const state of STATES) for (let i = 0; i < 4; i++) {
      const img = new Image();
      img.src = `./assets/ponies/rosy/${state}_${String(i).padStart(2, '0')}.png`;
      this.loaded.set(`${state}_${i}`, img);
    }
  }
  action(pose, ms = 2400) { this.state = pose; this.actionUntil = performance.now() + ms; this.frame = 0; this.elapsed = 0; this.behaviorElapsed = 0; }
  pet(pose = 'happy', ms = 1400) { this.action(pose, ms); }
  update(dt, now, pet) {
    const reduced = this.reducedMotion.matches;
    this.elapsed += dt;
    this.behaviorElapsed += dt;
    if (this.elapsed >= (this.state === 'sleep' || this.state === 'doze' ? .8 : .3)) { this.elapsed = 0; this.frame = (this.frame + 1) % 4; }
    if (now > this.actionUntil) {
      if (pet.hunger < 15 || pet.happiness < 15 || pet.hygiene < 10) this.state = 'sad';
      else if (pet.energy < 12) this.state = 'sleep';
      else if (this.behaviorElapsed > this.behaviorDuration) {
        this.behaviorElapsed = 0;
        const habit = chooseAutonomousHabit(Math.random, this.lastHabitState, pet);
        this.lastHabitState = habit.state;
        this.state = habit.state;
        this.behaviorDuration = habit.min + Math.random() * (habit.max - habit.min);
        if (habit.state === 'walk' || Math.random() < .45) this.direction *= -1;
        if (this.onHabit) this.onHabit(habit);
      }
      if (this.state === 'walk' && !reduced) {
        this.x += dt * 14 * this.direction;
        if (this.x < 34) { this.x = 34; this.direction = 1; }
        if (this.x > 158) { this.x = 158; this.direction = -1; }
      }
    }
    const canBlink = !reduced && now >= this.actionUntil && ['idle', 'look', 'curious'].includes(this.state);
    if (canBlink) {
      this.blinkIn -= dt;
      if (this.blinkRemaining > 0) this.blinkRemaining = Math.max(0, this.blinkRemaining - dt);
      if (this.blinkIn <= 0 && this.blinkRemaining === 0) {
        this.blinkRemaining = .32;
        this.blinkIn = 4.5 + Math.random() * 2.5;
      }
    }
    const pose = this.state === 'blink' || (canBlink && this.blinkRemaining > 0)
      ? 'blink'
      : this.state === 'look' || this.state === 'curious' ? 'idle'
      : this.state === 'play' || this.state === 'stretch' ? 'happy'
      : this.state === 'sniff' ? 'eat'
      : this.state === 'groom' ? 'wash'
      : this.state === 'doze' ? 'sleep'
      : this.state;
    const frame = reduced ? 0 : this.frame;
    const img = this.loaded.get(`${pose}_${frame}`);
    this.wrap.dataset.pose = this.state;
    const bounce = !reduced && (this.state === 'play' || this.state === 'stretch' || this.state === 'happy')
      ? -Math.abs(Math.sin(now / 180)) * (this.state === 'stretch' ? 5 : 12)
      : !reduced && this.state === 'walk' ? Math.sin(now / 100) * 1.5 : 0;
    const tilt = !reduced && (this.state === 'look' || this.state === 'curious') ? Math.sin(this.behaviorElapsed * 2) * 4 : 0;
    const sniff = !reduced && this.state === 'sniff' ? Math.max(0, Math.sin(now / 170)) * 5 : 0;
    const doze = !reduced && this.state === 'doze' ? Math.sin(now / 520) * 1.5 : 0;
    this.el.style.transform = `translateY(${bounce + sniff + doze}px) rotate(${tilt}deg)`;
    const hit = document.getElementById('petTap');
    if (hit) { hit.style.left = `${this.x}px`; hit.style.top = `${this.wrap.offsetTop}px`; hit.style.width = '144px'; hit.style.height = '144px'; }
    if (img && this.el.src !== img.src) this.el.src = img.src;
    this.wrap.style.left = `${this.x}px`;
    this.wrap.style.transform = `scaleX(${this.direction})`;
  }
}
