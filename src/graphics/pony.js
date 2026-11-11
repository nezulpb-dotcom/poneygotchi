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

export function chooseAutonomousHabit(random = Math.random, previousState = null) {
  const choices = previousState
    ? AUTONOMOUS_HABITS.filter((habit) => habit.state !== previousState)
    : AUTONOMOUS_HABITS;
  const index = Math.min(choices.length - 1, Math.floor(random() * choices.length));
  return { ...choices[index] };
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
  pet() { this.action('happy', 1400); }
  update(dt, now, pet) {
    const reduced = this.reducedMotion.matches;
    this.elapsed += dt;
    this.behaviorElapsed += dt;
    if (this.elapsed >= (this.state === 'sleep' || this.state === 'doze' ? .65 : .24)) { this.elapsed = 0; this.frame = (this.frame + 1) % 4; }
    if (now > this.actionUntil) {
      if (pet.hunger < 15 || pet.happiness < 15 || pet.hygiene < 10) this.state = 'sad';
      else if (pet.energy < 12) this.state = 'sleep';
      else if (this.behaviorElapsed > this.behaviorDuration) {
        this.behaviorElapsed = 0;
        const habit = chooseAutonomousHabit(Math.random, this.lastHabitState);
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
    const pose = this.state === 'look' || this.state === 'curious'
      ? (this.frame === 2 ? 'blink' : 'idle')
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
