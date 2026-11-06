export const STORAGE_KEY = 'ponygotchi_v08';

export const ITEMS = [
  { id: 'none', label: 'Sans accessoire', symbol: '♡', cost: 0, level: 1 },
  { id: 'bow', label: 'Nœud rose', symbol: '🎀', cost: 20, level: 1 },
  { id: 'flower', label: 'Couronne fleurie', symbol: '🌸', cost: 40, level: 2 },
  { id: 'sparkle', label: 'Étincelles', symbol: '✨', cost: 45, level: 2 },
  { id: 'scarf', label: 'Écharpe pastel', symbol: '🧣', cost: 60, level: 3 },
  { id: 'halo', label: 'Auréole', symbol: '👑', cost: 85, level: 4 },
];

export const clamp = (v) => Math.max(0, Math.min(100, v));
export const xpThreshold = (level) => 75 + level * 25;
export const localDateKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function emptyDay(date = new Date()) {
  return { date: localDateKey(date), meals: { morning: false, noon: false, evening: false }, water: 0, movement: false, pause: false, mealsBonus: false };
}

export function newGame(date = new Date()) {
  return {
    version: 8,
    pet: { hunger: 82, happiness: 90, energy: 78, hygiene: 88, level: 1, xp: 0, stars: 30 },
    daily: emptyDay(date),
    inventory: ['none'],
    equipped: 'none',
    settings: { waterReminder: false, waterMinutes: 90, nextWaterAt: 0 },
    lastCareAward: {},
    updatedAt: date.getTime(),
  };
}

export function restoreGame(raw, date = new Date()) {
  const fresh = newGame(date);
  if (!raw || typeof raw !== 'object') return fresh;
  const merged = {
    ...fresh, ...raw,
    pet: { ...fresh.pet, ...(raw.pet || {}) },
    daily: { ...fresh.daily, ...(raw.daily || {}), meals: { ...fresh.daily.meals, ...(raw.daily?.meals || {}) } },
    settings: { ...fresh.settings, ...(raw.settings || {}) },
    inventory: Array.isArray(raw.inventory) ? [...new Set(['none', ...raw.inventory])] : ['none'],
    lastCareAward: raw.lastCareAward || {},
  };
  for (const k of ['hunger', 'happiness', 'energy', 'hygiene']) {
    merged.pet[k] = clamp(Number(merged.pet[k]) || 0);
  }
  merged.pet.stars = Math.max(0, Number(merged.pet.stars) || 0);
  merged.pet.level = Math.max(1, Math.floor(Number(merged.pet.level) || 1));
  merged.pet.xp = Math.max(0, Number(merged.pet.xp) || 0);
  if (merged.daily.date !== localDateKey(date)) merged.daily = emptyDay(date);
  if (!ITEMS.some((i) => i.id === merged.equipped) || !merged.inventory.includes(merged.equipped)) merged.equipped = 'none';
  merged.updatedAt = Number.isFinite(merged.updatedAt) ? merged.updatedAt : date.getTime();
  return merged;
}

export function advanceDay(game, date = new Date()) {
  if (game.daily.date !== localDateKey(date)) game.daily = emptyDay(date);
}

export function grant(game, { stars = 0, xp = 0 } = {}) {
  game.pet.stars += stars;
  game.pet.xp += xp;
  let leveledUp = 0;
  while (game.pet.xp >= xpThreshold(game.pet.level)) {
    game.pet.xp -= xpThreshold(game.pet.level);
    game.pet.level += 1;
    game.pet.stars += 15;
    leveledUp++;
  }
  return { leveledUp, stars: game.pet.stars, level: game.pet.level };
}

// Call once a minute while the demo runs; the prototype does not silently
// penalize players for time spent with the app closed.
export function decayNeeds(game, minutes = 1) {
  const n = Math.max(0, Math.min(60, Math.floor(minutes)));
  game.pet.hunger = clamp(game.pet.hunger - 2 * n);
  game.pet.happiness = clamp(game.pet.happiness - n);
  game.pet.energy = clamp(game.pet.energy - n);
  game.pet.hygiene = clamp(game.pet.hygiene - n);
}

export function care(game, action, now = Date.now()) {
  const p = game.pet;
  switch (action) {
    case 'feed': p.hunger = clamp(p.hunger + 25); p.hygiene = clamp(p.hygiene - 4); break;
    case 'play':
      if (p.hunger < 10 || p.energy < 10) return { ok: false, message: 'Rosy est un peu fatiguée…' };
      p.happiness = clamp(p.happiness + 20); p.hunger = clamp(p.hunger - 6); p.energy = clamp(p.energy - 10); break;
    case 'sleep': p.energy = clamp(p.energy + 30); p.hunger = clamp(p.hunger - 5); break;
    case 'wash': p.hygiene = clamp(p.hygiene + 35); p.happiness = clamp(p.happiness + 5); break;
    default: return { ok: false, message: 'Action inconnue' };
  }
  const canReward = now - (game.lastCareAward[action] || 0) > 30_000;
  let reward = null;
  if (canReward) {
    game.lastCareAward[action] = now;
    reward = { stars: 2, xp: 4 };
    grant(game, reward);
  }
  return { ok: true, reward };
}

// Personal habits are optional: no punishment, no prescribed meal timing,
// water quantity, exercise dosage, or health claim.
export function completeQuest(game, type, date = new Date()) {
  advanceDay(game, date);
  const day = game.daily;
  const meals = ['morning', 'noon', 'evening'];
  let reward = { stars: 0, xp: 0 };
  if (meals.includes(type)) {
    if (day.meals[type]) return { ok: false, reason: 'already-done' };
    day.meals[type] = true; reward = { stars: 12, xp: 18 };
  } else if (type === 'water') {
    day.water += 1;
    // Count all check-ins, but grant rewards at most three times daily.
    if (day.water <= 3) reward = { stars: 5, xp: 7 };
  } else if (type === 'movement') {
    if (day.movement) return { ok: false, reason: 'already-done' };
    day.movement = true; reward = { stars: 12, xp: 20 };
  } else if (type === 'pause') {
    if (day.pause) return { ok: false, reason: 'already-done' };
    day.pause = true; reward = { stars: 10, xp: 15 };
  } else return { ok: false, reason: 'unknown' };
  grant(game, reward);
  let bonus = null;
  if (meals.every((m) => day.meals[m]) && !day.mealsBonus) {
    day.mealsBonus = true;
    bonus = { stars: 20, xp: 30 };
    grant(game, bonus);
  }
  return { ok: true, reward, bonus };
}

export function buyOrEquip(game, itemId) {
  const item = ITEMS.find((it) => it.id === itemId);
  if (!item) return { ok: false, reason: 'unknown' };
  if (game.pet.level < item.level) return { ok: false, reason: 'locked' };
  if (!game.inventory.includes(itemId)) {
    if (game.pet.stars < item.cost) return { ok: false, reason: 'not-enough-stars' };
    game.pet.stars -= item.cost;
    game.inventory.push(itemId);
  }
  game.equipped = itemId;
  return { ok: true, item };
}
