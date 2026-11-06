const STATES = ['idle', 'walk', 'blink', 'happy', 'eat', 'sleep', 'sad', 'wash'];
export class PonyAnimator {
  constructor(el) {
    this.el = el;
    this.wrap = el.closest('.pony-wrap');
    this.state = 'idle';
    this.direction = 1;
    this.x = 90;
    this.elapsed = 0;
    this.behaviorElapsed = 0;
    this.frame = 0;
    this.actionUntil = 0;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.behaviorDuration = 3;
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
    if (this.elapsed >= (this.state === 'sleep' ? .65 : .24)) { this.elapsed = 0; this.frame = (this.frame + 1) % 4; }
    if (now > this.actionUntil) {
      if (pet.hunger < 15 || pet.happiness < 15 || pet.hygiene < 10) this.state = 'sad';
      else if (pet.energy < 12) this.state = 'sleep';
      else if (this.behaviorElapsed > this.behaviorDuration) {
        this.behaviorElapsed = 0;
        const r = Math.random();
        this.state = r < .42 ? 'walk' : r < .66 ? 'idle' : r < .84 ? 'look' : 'play';
        this.behaviorDuration = this.state === 'walk' ? 3 + Math.random() * 3 : 2 + Math.random() * 2;
        if (Math.random() < .45) this.direction *= -1;
      }
      if (this.state === 'walk' && !reduced) {
        this.x += dt * 14 * this.direction;
        if (this.x < 34) { this.x = 34; this.direction = 1; }
        if (this.x > 158) { this.x = 158; this.direction = -1; }
      }
    }
    const pose = this.state === 'look' ? (this.frame === 2 ? 'blink' : 'idle') : this.state === 'play' ? 'happy' : this.state;
    const frame = reduced ? 0 : this.frame;
    const img = this.loaded.get(`${pose}_${frame}`);
    this.wrap.dataset.pose = this.state;
    const bounce = !reduced && (this.state === 'play' || this.state === 'happy') ? -Math.abs(Math.sin(now / 180)) * 12 : !reduced && this.state === 'walk' ? Math.sin(now / 100) * 1.5 : 0;
    const look = !reduced && this.state === 'look' ? Math.sin(this.behaviorElapsed * 2) * 4 : 0;
    this.el.style.transform = `translateY(${bounce}px) rotate(${look}deg)`;
    const hit = document.getElementById('petTap');
    if (hit) { hit.style.left = `${this.x}px`; hit.style.top = `${this.wrap.offsetTop}px`; hit.style.width = '144px'; hit.style.height = '144px'; }
    if (img && this.el.src !== img.src) this.el.src = img.src;
    this.wrap.style.left = `${this.x}px`;
    this.wrap.style.transform = `scaleX(${this.direction})`;
  }
}
