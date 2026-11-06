import { STORAGE_KEY, newGame, restoreGame } from './game.js';

function getStorage() {
  try { return globalThis.localStorage; }
  catch { return null; } // opaque origin, embedded demo, restrictive private mode
}

export function loadGame(storage, date = new Date()) {
  try {
    const target = storage ?? getStorage();
    if (!target) return newGame(date);
    return restoreGame(JSON.parse(target.getItem(STORAGE_KEY)), date);
  }
  catch { return newGame(date); }
}

export function saveGame(game, storage) {
  try {
    const target = storage ?? getStorage();
    if (!target) return false;
    target.setItem(STORAGE_KEY, JSON.stringify(game));
    return true;
  }
  catch { return false; }
}
