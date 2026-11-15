export const STORAGE_KEY = 'daft-punk-concert-companion-v1';

export const QUESTS = [
  { id: 'water', stat: 'moral', gain: 25, icon: '💧', title: 'Recharge les batteries', detail: 'Bois un verre d’eau si tu en as envie' },
  { id: 'friends', stat: 'moral', gain: 25, icon: '✦', title: 'Bonnes vibrations', detail: 'Envoie un petit mot positif à quelqu’un' },
  { id: 'rhythm', stat: 'music', gain: 25, icon: '♫', title: 'Beat laboratory', detail: 'Réussis le mini-défi de rythme' },
  { id: 'playlist', stat: 'music', gain: 25, icon: '▣', title: 'Le prochain morceau', detail: 'Choisis un morceau pour ta playlist' },
  { id: 'ideas', stat: 'inspiration', gain: 25, icon: '✧', title: 'Chasse aux idées', detail: 'Note une idée pour le prochain concert' },
  { id: 'pause', stat: 'inspiration', gain: 25, icon: '☼', title: 'Pause backstage', detail: 'Accorde-toi un moment de pause' },
];

export const dateKey = (date = new Date()) =>
  [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');

export function createState(date = new Date()) {
  return {
    version: 1,
    date: dateKey(date),
    completed: [],
    stats: { moral: 0, music: 0, inspiration: 0 },
    concerts: 0,
  };
}

export function normalizeState(raw, date = new Date()) {
  const fresh = createState(date);
  if (!raw || typeof raw !== 'object') return fresh;
  const stats = raw.stats && typeof raw.stats === 'object' ? raw.stats : {};
  const validIds = new Set(QUESTS.map((quest) => quest.id));
  const sameDay = raw.date === fresh.date;
  return {
    ...fresh,
    date: fresh.date,
    completed: sameDay && Array.isArray(raw.completed)
      ? [...new Set(raw.completed.filter((id) => validIds.has(id)))] : [],
    stats: Object.fromEntries(['moral', 'music', 'inspiration'].map((key) => [
      key, Math.max(0, Math.min(100, Math.floor(Number(stats[key]) || 0))),
    ])),
    concerts: Math.max(0, Math.floor(Number(raw.concerts) || 0)),
  };
}

export function loadState(storage = globalThis.localStorage, date = new Date()) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    return normalizeState(raw ? JSON.parse(raw) : null, date);
  } catch {
    return createState(date);
  }
}

export function saveState(state, storage = globalThis.localStorage) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
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

export function concertReady(state) {
  return ['moral', 'music', 'inspiration'].every((key) => state.stats[key] >= 100);
}

export function launchConcert(state) {
  if (!concertReady(state)) return { state, ok: false };
  return { state: { ...state, concerts: state.concerts + 1 }, ok: true };
}
