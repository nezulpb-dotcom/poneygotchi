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
    this.loaded = new Map();
    for (const state of STATES) for (let i = 0; i < 4; i++) {
      const img = new Image();
      img.src = `./assets/ponies/rosy/${state}_${String(i).padStart(2, '0')}.png`;
      this.loaded.set(`${state}_${i}`, img);
    }
  }
  action(pose, ms = 2400) { this.state = pose; this.actionUntil = performance.now() + ms; this.frame = 0; }
  pet() { this.action('happy', 1400); }
  update(dt, now, pet) {
    this.elapsed += dt;
    this.behaviorElapsed += dt;
    if (this.elapsed >= .24) { this.elapsed = 0; this.frame = (this.frame + 1) % 4; }
    if (now > this.actionUntil) {
      if (pet.hunger < 15 || pet.happiness < 15 || pet.hygiene < 10) this.state = 'sad';
      else if (pet.energy < 12) this.state = 'sleep';
      else if (this.behaviorElapsed > 2.8) {
        this.behaviorElapsed = 0;
        const r = Math.random();
        this.state = r < .53 ? 'walk' : r < .82 ? 'idle' : 'blink';
        if (Math.random() < .45) this.direction *= -1;
      }
      if (this.state === 'walk') {
        this.x += dt * 14 * this.direction;
        if (this.x < 34) { this.x = 34; this.direction = 1; }
        if (this.x > 158) { this.x = 158; this.direction = -1; }
      }
    }
    const img = this.loaded.get(`${this.state}_${this.frame}`);
    if (img && this.el.src !== img.src) this.el.src = img.src;
    this.wrap.style.left = `${this.x}px`;
    this.wrap.style.transform = `scaleX(${this.direction})`;
  }
}
