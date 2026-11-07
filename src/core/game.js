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
    version: 10,
    pet: { hunger: 82, happiness: 90, energy: 78, hygiene: 88, level: 1, xp: 0, stars: 30 },
    daily: emptyDay(date),
    inventory: ['none'],
    equipped: 'none',
    explored: [],
    settings: { waterReminder: false, waterMinutes: 90, nextWaterAt: 0, clockOffsetMs: 0 },
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
  merged.explored = Array.isArray(raw.explored) ? [...new Set(raw.explored.filter(id => ['meadow','clearing','star'].includes(id)))] : [];
  if (!Number.isFinite(merged.settings.clockOffsetMs) || Math.abs(merged.settings.clockOffsetMs) > 86400000) merged.settings.clockOffsetMs = 0;
  for (const k of ['hunger', 'happiness', 'energy', 'hygiene']) {
    merged.pet[k] = clamp(Number(merged.pet[k]) || 0);
  }
  const bounded = (v, fallback, max) => Number.isFinite(Number(v)) ? Math.max(0, Math.min(max, Math.floor(Number(v)))) : fallback;
  merged.version = 10;
  merged.pet.stars = bounded(merged.pet.stars, 30, 10000000);
  merged.pet.level = Math.max(1, bounded(merged.pet.level, 1, 10000));
  merged.pet.xp = bounded(merged.pet.xp, 0, xpThreshold(merged.pet.level) - 1);
  merged.inventory = merged.inventory.filter(id => ITEMS.some(item => item.id === id));
  merged.daily.water = bounded(merged.daily.water, 0, 1000000);
  for (const id of ['morning', 'noon', 'evening']) merged.daily.meals[id] = merged.daily.meals[id] === true;
  for (const id of ['movement', 'pause', 'mealsBonus']) merged.daily[id] = merged.daily[id] === true;
  merged.settings.waterReminder = merged.settings.waterReminder === true;
  if (![60,90,120].includes(merged.settings.waterMinutes)) merged.settings.waterMinutes = 90;
  merged.settings.nextWaterAt = bounded(merged.settings.nextWaterAt, 0, 8640000000000000);
  merged.lastCareAward = Object.fromEntries(['feed','play','sleep','wash'].map(id => [id, bounded(raw.lastCareAward?.[id], 0, 8640000000000000)]));
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

// One-time discoveries preserve the three validated landscapes.
export const PLACES = [
  { id: 'meadow', label: 'Fleurs de la prairie', level: 1 },
  { id: 'clearing', label: 'Secret de la clairière', level: 2 },
  { id: 'star', label: 'Étoile du soir', level: 3 },
];
export function explore(game, id) {
  const place = PLACES.find(p => p.id === id);
  if (!place || game.pet.level < place.level || game.explored.includes(id)) return false;
  game.explored.push(id);
  grant(game, { stars: 5, xp: 10 });
  return true;
}
export function setManualTime(game, value, now = new Date()) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return false;
  const [hour, minute] = value.split(':').map(Number);
  const target = new Date(now); target.setHours(hour, minute, 0, 0);
  game.settings.clockOffsetMs = target.getTime() - now.getTime();
  return true;
}
export function displayDate(game, now = new Date()) {
  return new Date(now.getTime() + game.settings.clockOffsetMs);
}
