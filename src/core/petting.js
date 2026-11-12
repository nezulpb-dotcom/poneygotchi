const COOLDOWN_MS = 420;
const COMBO_WINDOW_MS = 1800;

const ZONES = [
  {
    id: 'forehead',
    pose: 'look',
    message: 'Rosy penche la tête sous les gratouilles du front…',
    repeatMessage: 'Encore une petite gratouille derrière l’oreille…',
  },
  {
    id: 'cheek',
    pose: 'happy',
    message: 'Mmm… les caresses sur la joue, elle adore !',
    repeatMessage: 'Rosy colle doucement sa joue à ta main…',
  },
  {
    id: 'mane',
    pose: 'groom',
    message: 'Rosy frissonne de plaisir sous sa crinière…',
    repeatMessage: 'Sa crinière frétille sous tes doigts…',
  },
];

const finitePositive = (value, fallback) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

export function createPettingState() {
  return { lastAt: -Infinity, lastZone: null, streak: 0 };
}

export function petRosy(state, point = {}, now = 0) {
  const previous = state && typeof state === 'object' ? state : createPettingState();
  if (!Number.isFinite(now) || now - previous.lastAt < COOLDOWN_MS) {
    return { accepted: false, state: previous };
  }

  const width = finitePositive(point.width, 144);
  const height = finitePositive(point.height, 144);
  const x = Math.max(0, Math.min(width, Number.isFinite(point.x) ? point.x : width / 2));
  const y = Math.max(0, Math.min(height, Number.isFinite(point.y) ? point.y : height / 2));
  const relativeY = y / height;
  const zone = relativeY < 0.32 ? ZONES[0] : relativeY < 0.70 ? ZONES[1] : ZONES[2];
  const inCombo = now - previous.lastAt <= COMBO_WINDOW_MS;
  const streak = inCombo ? (previous.streak >= 3 ? 1 : previous.streak + 1) : 1;
  const bonus = streak === 3;

  return {
    accepted: true,
    state: { lastAt: now, lastZone: zone.id, streak },
    zone: zone.id,
    x,
    y,
    happiness: 2,
    pose: bonus ? 'play' : zone.pose,
    duration: bonus ? 1850 : 1450,
    streak,
    bonus,
    message: bonus
      ? 'Trois caresses ! Rosy fait un petit pas de danse ✨'
      : zone.id === previous.lastZone && inCombo ? zone.repeatMessage : zone.message,
  };
}
