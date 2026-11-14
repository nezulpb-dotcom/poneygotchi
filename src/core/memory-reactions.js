const readNeed = (pet, key) => {
  const raw = pet?.[key];
  if (raw === null || raw === undefined || raw === '') return 50;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 50;
};

const MATCHES = [
  { pose: 'happy', duration: 1100, message: 'Deux fleurs pareilles ! Rosy est ravie. 🌸' },
  { pose: 'happy', duration: 1200, message: 'Une jolie paire de plus ! Rosy remue joyeusement les oreilles. 🌼' },
  { pose: 'happy', duration: 1200, message: 'Bien joué ! Rosy te répond par un petit sourire. ♡' },
];

const MISMATCHES = [
  { pose: 'look', duration: 1000, message: 'Hmm… pas les mêmes ! Rosy cherche encore. ♡' },
  { pose: 'look', duration: 1050, message: 'Presque ! Rosy penche la tête devant ces fleurs.' },
  { pose: 'look', duration: 1000, message: 'Ces deux fleurs ne vont pas ensemble. On continue ?' },
];

const choose = (items, variant) => {
  const value = Number(variant);
  const index = Number.isFinite(value) ? Math.abs(Math.floor(value)) : 0;
  return { ...items[index % items.length] };
};

// Short, mood-aware responses reuse existing poses and never change rewards.
export function memoryReaction(result, pet = {}, variant = 0) {
  const energy = readNeed(pet, 'energy');
  const happiness = readNeed(pet, 'happiness');

  if (result === 'hint') {
    return { pose: 'look', duration: 1500, message: 'Rosy te montre deux fleurs… ♡' };
  }

  if (result === 'match') {
    if (energy < 25) return { pose: 'happy', duration: 1000, message: 'Tout doucement… une jolie paire retrouvée. 🌸' };
    if (happiness < 30) return { pose: 'happy', duration: 1100, message: 'Une paire retrouvée… Rosy se réjouit de ce petit moment avec toi. ♡' };
    return choose(MATCHES, variant);
  }

  if (result === 'mismatch') {
    if (happiness < 30) return { pose: 'look', duration: 1100, message: 'Ce n’est pas grave, Rosy cherche avec toi. ♡' };
    if (energy < 25) return { pose: 'look', duration: 1000, message: 'On prend notre temps… les fleurs attendent. ♡' };
    return choose(MISMATCHES, variant);
  }

  if (result === 'complete') {
    if (energy < 25) return { pose: 'happy', duration: 1700, message: 'Le jardin est terminé… Rosy sourit tout doucement. 🌸' };
    if (happiness < 30) return { pose: 'happy', duration: 2100, message: 'Tu as réussi ! Rosy est fière de ce joli moment avec toi. ♡' };
    return { pose: 'play', duration: 2400, message: 'Toutes les fleurs sont réunies ! Rosy danse de joie. ✨' };
  }

  return null;
}
