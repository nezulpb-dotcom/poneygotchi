export const STORAGE_KEY = 'daft-punk-concert-companion-v1';

export const QUESTS = [
  { id: 'water', stat: 'moral', gain: 20 },
  { id: 'meal', stat: 'moral', gain: 20 },
  { id: 'move', stat: 'moral', gain: 20 },
  { id: 'pause', stat: 'moral', gain: 20 },
  { id: 'idea', stat: 'inspiration', gain: 25 },
  { id: 'tidy', stat: 'inspiration', gain: 25 },
];

export const dateKey = (date = new Date()) =>
  [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');

export function createState(date = new Date()) {
  return { version: 1, date: dateKey(date), completed: [], wins: [],
    stats: { moral: 0, music: 0, inspiration: 0 }, concerts: 0,
    mix: { bass: 1, lead: 1, beat: 1 }, theme: 'alive' };
}

export function normalizeState(raw, date = new Date()) {
  const fresh = createState(date);
  if (!raw || typeof raw !== 'object') return fresh;
  const stats = raw.stats && typeof raw.stats === 'object' ? raw.stats : {};
  const validQuests = new Set(QUESTS.map((quest) => quest.id));
  const validWins = new Set(['beat', 'memory', 'mix']);
  const sameDay = raw.date === fresh.date;
  const mix = raw.mix && typeof raw.mix === 'object' ? raw.mix : {};
  return {
    ...fresh,
    completed: sameDay && Array.isArray(raw.completed)
      ? [...new Set(raw.completed.filter((id) => validQuests.has(id)))] : [],
    wins: sameDay && Array.isArray(raw.wins)
      ? [...new Set(raw.wins.filter((id) => validWins.has(id)))] : [],
    stats: Object.fromEntries(['moral', 'music', 'inspiration'].map((key) => [
      key, Math.max(0, Math.min(100, Math.floor(Number(stats[key]) || 0))),
    ])),
    concerts: Math.max(0, Math.floor(Number(raw.concerts) || 0)),
    theme: ['alive', 'ram', 'tron'].includes(raw.theme) ? raw.theme : 'alive',
    mix: Object.fromEntries(['bass', 'lead', 'beat'].map((key) => [
      key, Math.max(1, Math.min(3, Math.floor(Number(mix[key]) || 1))),
    ])),
  };
}

export function loadState(storage, date = new Date()) {
  try {
    const target = storage ?? globalThis.localStorage;
    let raw = target?.getItem(STORAGE_KEY);
    if (!raw) {
      const legacy = target?.getItem('daftpunk-companion-beta03');
      if (legacy) {
        const previous = JSON.parse(legacy);
        raw = JSON.stringify({ ...previous, completed: previous.completed ?? previous.done ?? [] });
      }
    }
    return normalizeState(raw ? JSON.parse(raw) : null, date);
  } catch {
    return createState(date);
  }
}

export function saveState(state, storage) {
  try {
    const target = storage ?? globalThis.localStorage;
    target?.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function completeQuest(state, questId, date = new Date()) {
  const current = normalizeState(state, date);
  if (current.completed.includes(questId)) return { state: current, ok: false, reason: 'already-completed' };
  const quest = QUESTS.find((item) => item.id === questId);
  if (!quest) return { state: current, ok: false, reason: 'unknown-quest' };
  current.completed.push(questId);
  current.stats[quest.stat] = Math.min(100, current.stats[quest.stat] + quest.gain);
  return { state: current, ok: true, quest };
}

export function awardMiniGame(state, gameId, stat, points, date = new Date()) {
  const current = normalizeState(state, date);
  if (current.wins.includes(gameId)) return { state: current, ok: false, reason: 'already-won' };
  if (!['beat', 'memory', 'mix'].includes(gameId) || !['moral', 'music', 'inspiration'].includes(stat)) {
    return { state: current, ok: false, reason: 'invalid-reward' };
  }
  current.wins.push(gameId);
  current.stats[stat] = Math.min(100, current.stats[stat] + Math.max(0, Math.floor(points)));
  return { state: current, ok: true };
}

export function concertReady(state) {
  return ['moral', 'music', 'inspiration'].every((key) => state.stats[key] >= 100);
}

export function launchConcert(state) {
  if (!concertReady(state)) return { state, ok: false };
  return { state: { ...state, concerts: state.concerts + 1 }, ok: true };
}
