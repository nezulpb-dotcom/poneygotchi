import { ITEMS, xpThreshold } from '../core/game.js';

const hearts = (value) => {
  const filled = Math.max(0, Math.min(3, Math.round(value / 100 * 3)));
  return '<span class="hearts">' + Array.from({ length: 3 }, (_, i) => `<span class="${i < filled ? 'on' : ''}">♥</span>`).join('') + '</span>';
};

export function renderMiniStats(pet) {
  return [
    ['Bonheur', '💗', pet.happiness],
    ['Faim', '🍎', pet.hunger],
    ['Énergie', '⚡', pet.energy],
    ['Propreté', '💧', pet.hygiene],
  ].map(([label, icon, value]) => `<div class="mini-stat"><div class="mini-icon">${icon}</div>${hearts(value)}<span>${label}</span></div>`).join('');
}

const questButton = (type, done, label = 'Noter') =>
  `<button class="small-btn" data-quest="${type}" ${done ? 'disabled' : ''}>${done ? '✓ Noté' : label}</button>`;

export function renderPanel(tab, game, memoryRound = null) {
  const { pet, daily } = game;
  switch (tab) {
    case 'missions': {
      const mealNames = [['morning', 'Petit-déjeuner'], ['noon', 'Déjeuner'], ['evening', 'Dîner']];
      return `<p class="panel-sub">Des habitudes facultatives, à ton rythme. Il n’y a aucune pénalité si tu ne coches rien.</p>
        <div class="panel-kicker">Repas du jour</div>
        ${mealNames.map(([id, label]) => `<div class="task"><span>${daily.meals[id] ? '✓' : '♡'} ${label}</span>${questButton(id, daily.meals[id])}</div>`).join('')}
        <p class="panel-small">Bonus d'étoiles et d'XP quand les trois sont notés.</p>
        <div class="panel-kicker">Petits moments</div>
        <div class="task"><span>💧 Pause eau (${daily.water})</span>${questButton('water', false, 'J’ai bu')}</div>
        <div class="task"><span>🌿 Bouger un peu</span>${questButton('movement', daily.movement)}</div>
        <div class="task"><span>☁️ Faire une pause</span>${questButton('pause', daily.pause)}</div>
        <p class="panel-small">Pas de quantité d’eau prescrite. Les trois premières confirmations donnent une récompense ; les suivantes restent enregistrées.</p>`;
    }
    case 'shop':
      return `<div class="panel-sub">✧ <b>${pet.stars}</b> étoiles disponibles · Équipe Rosy avec ce que tu débloques.</div><div class="shop-grid">
        ${ITEMS.map(item => {
          const owned = game.inventory.includes(item.id), equipped = game.equipped === item.id;
          const locked = pet.level < item.level;
          return `<div class="shop-item"><div class="shop-emoji">${item.symbol}</div><b>${item.label}</b><small>${locked ? `Niv. ${item.level} requis` : owned ? 'Dans ta collection' : `${item.cost} ✧`}</small>
            <button class="small-btn" data-buy="${item.id}" ${equipped || locked || (!owned && pet.stars < item.cost) ? 'disabled' : ''}>${equipped ? 'Équipé' : owned ? 'Équiper' : locked ? 'Verrouillé' : 'Acheter'}</button></div>`;
        }).join('')}
      </div>`;
    case 'levels':
      return `<div class="panel-sub">✦ <b>Niveau ${pet.level}</b> · ${pet.xp} / ${xpThreshold(pet.level)} XP</div>
        <div class="level-progress"><span style="width:${Math.max(0, Math.min(100, pet.xp / xpThreshold(pet.level) * 100))}%"></span></div>
        <p class="panel-small">Chaque niveau donne 15 étoiles ✧ et ouvre progressivement des accessoires.</p>
        <div class="panel-kicker">Besoins de Rosy</div>
        ${[['💗 Bonheur',pet.happiness],['🍎 Faim',pet.hunger],['⚡ Énergie',pet.energy],['💧 Propreté',pet.hygiene]].map(([k,v])=>`<div class="task"><span>${k}</span><b>${Math.round(v)}%</b></div>`).join('')}`;
    case 'memory': {
      const rewardNote = game.daily.memoryRewarded
        ? 'La petite récompense du jour est déjà obtenue ; tu peux rejouer pour le plaisir.'
        : 'Première victoire du jour : +12 étoiles et +15 XP.';
      if (!memoryRound) {
        return `<p class="panel-sub">Choisis ton petit défi floral. Aucun chronomètre : Rosy t’attend tranquillement.</p>
          <div class="memory-mode-list">
            <button class="small-btn" data-memory-start="3">Jardin doux · 3 paires</button>
            <button class="small-btn" data-memory-start="4">Prairie fleurie · 4 paires</button>
          </div>
          <p class="panel-small">${rewardNote}</p>`;
      }
      const pairCount = memoryRound.pairCount === 4 ? 4 : 3;
      const hintsRemaining = Math.max(0, 2 - (memoryRound.hintsUsed || 0));
      const hintDisabled = memoryRound.finished || hintsRemaining === 0 || memoryRound.firstCard !== null
        || memoryRound.pendingHide.length > 0 || Boolean(memoryRound.hintedPair?.length);
      const cards = memoryRound.cards.map((card, index) => {
        const hinted = memoryRound.hintedPair?.includes(index) || false;
        const visible = card.revealed || card.matched || hinted;
        const label = hinted && !card.revealed && !card.matched
          ? `Indice de Rosy : carte ${index + 1}, ${card.symbol}`
          : visible ? `Carte ${index + 1} : ${card.symbol}` : `Retourner la carte ${index + 1}`;
        const pressed = card.revealed || card.matched;
        return `<button class="memory-card${card.matched ? ' matched' : ''}${hinted ? ' hinted' : ''}" data-memory-card="${index}" aria-label="${label}" aria-pressed="${pressed}" ${card.matched ? 'disabled' : ''}>${visible ? card.symbol : '✧'}</button>`;
      }).join('');
      const status = memoryRound.finished
        ? 'Toutes les fleurs sont réunies ! Rosy est ravie.'
        : memoryRound.pendingHide.length
          ? 'Ces deux fleurs sont différentes. Touche une autre carte pour continuer.'
          : memoryRound.hintedPair?.length
            ? 'Rosy te montre deux fleurs : observe-les avant de continuer.'
          : memoryRound.firstCard !== null
            ? 'Jolie trouvaille ! Cherche la fleur jumelle.'
            : 'Retourne deux cartes pour retrouver une paire.';
      const modeName = pairCount === 4 ? 'Prairie fleurie' : 'Jardin doux';
      return `<p class="panel-sub">${modeName} : ${pairCount} paires de fleurs, à ton rythme.</p>
        <div class="memory-grid${pairCount === 4 ? ' memory-grid-4' : ''}" role="group" aria-label="Cartes du jardin de mémoire, ${pairCount} paires">${cards}</div>
        <button class="small-btn memory-hint" data-memory-hint ${hintDisabled ? 'disabled' : ''}>✧ Aide de Rosy · ${hintsRemaining} indice${hintsRemaining === 1 ? '' : 's'} restant${hintsRemaining === 1 ? '' : 's'}</button>
        <p class="panel-small" role="status" aria-live="polite" aria-atomic="true">${status}</p>
        <p class="panel-small">Paires : ${memoryRound.matches}/${pairCount} · Coups : ${memoryRound.moves}</p>
        <p class="panel-small">${rewardNote}</p>
        <p class="panel-small">Deux indices maximum par partie ; ils ne comptent pas comme des coups et ne changent pas la récompense.</p>
        ${memoryRound.finished ? '<button class="small-btn" data-memory-start="3">Rejouer au jardin doux</button><button class="small-btn" data-memory-start="4">Rejouer à la prairie fleurie</button>' : ''}`;
    }
    case 'settings':
      return `<div class="panel-sub">Les données sont conservées localement dans ton navigateur. Les rappels fonctionnent uniquement tant que la page est ouverte.</div>
        <label class="setting-line">Rappels d’eau (facultatifs) <input id="reminderToggle" type="checkbox" ${game.settings.waterReminder ? 'checked' : ''}></label>
        <label class="setting-line">Intervalle <select id="reminderInterval">
          ${[60,90,120].map(n=>`<option value="${n}" ${game.settings.waterMinutes === n ? 'selected' : ''}>${n} min</option>`).join('')}</select></label>
        <p class="panel-small">Aucune alerte entre 22 h et 9 h. Le temps accéléré du jeu n’accélère pas les rappels.</p>
        <button class="small-btn secondary" data-reset="true">Recommencer la partie</button>`;
    default: return '';
  }
}
