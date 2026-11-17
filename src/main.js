import { loadGame, saveGame } from './core/storage.js';
import { advanceDay, buyOrEquip, care, completeQuest, decayNeeds, ITEMS, grant, clamp, followFirefly, followPetal, collectMeadowMemory } from './core/game.js';
import { createMemoryRound, revealMemoryCard, revealMemoryHint, clearMemoryHint, recordMemoryWin } from './core/memory-game.js';
import { memoryReaction } from './core/memory-reactions.js';
import { createPettingState, petRosy } from './core/petting.js';
import { PonyAnimator } from './graphics/pony.js';
import { renderMiniStats, renderPanel } from './ui/panels.js';

const $ = (id) => document.getElementById(id);
const game = loadGame();
const pony = new PonyAnimator($('ponySprite'), (habit) => {
  $('statusPetal').textContent = habit.message;
  if (habit.speak) say(habit.message);
});
let hudOpen = false;
let panelTab = 'missions';
let selectedAlbumDay = null;
let hudHideTimer;
let bubbleTimer;
let sceneTimer;
let petBurstTimer;
let lastFrame = performance.now();
let needAccumulator = 0;
let lastSaved = Date.now();
let currentScene = '';
let fireflyFeedbackUntil = 0;
let petalFeedbackUntil = 0;
let petalFeedbackTimer;
let petalVisualStep = Math.max(0, Math.min(2, Number(game.daily.petalsFollowed) || 0));
let memoryRound = null;
let memoryHintTimer;
let pettingState = createPettingState();

function save() { game.updatedAt = Date.now(); saveGame(game); }
function refreshStats() { $('miniStats').innerHTML = renderMiniStats(game.pet); }
function say(message) {
  $('bubble').textContent = message;
  $('bubble').classList.add('visible');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => $('bubble').classList.remove('visible'), 2400);
}
function reactToMemory(result, variant = 0, suffix = '') {
  const reaction = memoryReaction(result, game.pet, variant);
  if (!reaction) return;
  pony.pet(reaction.pose, reaction.duration);
  const message = reaction.message + suffix;
  $('statusPetal').textContent = message;
  say(message);
}
function updateFireflyTarget() {
  const target = $('fireflyTap');
  if (!target) return;
  const feedback = Date.now() < fireflyFeedbackUntil;
  const panelOpen = $('sheetWrap').classList.contains('open');
  const step = Math.max(0, Math.min(2, Number(game.daily.fireflyStep) || 0));
  const visible = currentScene === 'night' && !hudOpen && !panelOpen && (!game.daily.fireflyFound || feedback);
  target.dataset.step = String(step);
  target.setAttribute('aria-label', step === 1 ? 'Retrouver la luciole de l’autre côté' : 'Suivre la luciole du soir');
  target.classList.toggle('trail-second', step === 1);
  target.hidden = !visible;
  target.classList.toggle('found', visible && game.daily.fireflyFound && feedback);
}

 
function updatePetalTarget() {
  const target = $('petalTap');
  if (!target) return;
  const feedback = Date.now() < petalFeedbackUntil;
  const panelOpen = $('sheetWrap').classList.contains('open');
  const savedStep = Math.max(0, Math.min(3, Number(game.daily.petalsFollowed) || 0));
  const step = feedback ? petalVisualStep : savedStep;
  const labels = [
    'Suivre un pétale rose dans la prairie',
    'Retrouver le pétale près des fleurs',
    'Suivre le dernier pétale de la prairie',
  ];
  const visible = currentScene !== 'night' && !hudOpen && !panelOpen && (savedStep < 3 || feedback);
  target.dataset.step = String(step);
  target.setAttribute('aria-label', labels[Math.min(2, step)]);
  target.classList.toggle('petal-second', step === 1);
  target.classList.toggle('petal-third', step === 2);
  target.classList.toggle('caught', feedback);
  target.hidden = !visible;
  target.disabled = feedback || savedStep >= 3;
}
 
function hideHud() {
  hudOpen = false;
  clearTimeout(hudHideTimer);
  $('hud').classList.remove('open');
  $('screen').classList.remove('hud-active');
  $('hud').setAttribute('aria-hidden', 'true');
  updateFireflyTarget();
  updatePetalTarget();
}
function showHud() {
  hudOpen = true;
  updateFireflyTarget();
  updatePetalTarget();
  $('hud').classList.add('open');
  $('screen').classList.add('hud-active');
  $('hud').setAttribute('aria-hidden', 'false');
  refreshStats();
  clearTimeout(hudHideTimer);
  hudHideTimer = setTimeout(() => {
    if (!$('sheetWrap').classList.contains('open')) hideHud();
  }, 9000);
}
function showPanel(tab = 'missions') {
  panelTab = tab;
  $('sheetWrap').classList.add('open');
  $('sheetWrap').setAttribute('aria-hidden', 'false');
  updateFireflyTarget();
  updatePetalTarget();
  drawPanel();
  clearTimeout(hudHideTimer);
  $('closeSheet').focus();
}
function closePanel() {
  $('sheetWrap').classList.remove('open');
  $('sheetWrap').setAttribute('aria-hidden', 'true');
  showHud();
  $('openMenu').focus();
}
function drawPanel(preserveScroll = false) {
  const box = $('sheetContent');
  const scroll = preserveScroll ? $('sheetWrap').querySelector('.bottom-sheet').scrollTop : 0;
  box.innerHTML = renderPanel(panelTab, game, memoryRound, selectedAlbumDay);
  $('sheetWrap').querySelector('.bottom-sheet').scrollTop = scroll;
  for (const button of document.querySelectorAll('[data-tab]')) button.classList.toggle('active', button.dataset.tab === panelTab);
}
function setAccessory() {
  const item = ITEMS.find((i) => i.id === game.equipped);
  $('ponyAccessory').textContent = item?.id === 'none' ? '' : item?.symbol || '';
}
function careForRosy(action) {
  const result = care(game, action);
  if (!result.ok) { say(result.message); return; }
  const configs = {
    feed: { state: 'eat', message: 'Miam ! Merci pour la pomme ♡' },
    play: { state: 'happy', message: 'Youpi ! On s’amuse !' },
    sleep: { state: 'sleep', message: 'Bonne sieste, Rosy…' },
    wash: { state: 'wash', message: 'Toute propre ! ✨' },
  };
  const chosen = configs[action];
  pony.action(chosen.state, 3000);
  $('statusPetal').textContent = chosen.message;
  say(chosen.message);
  setSceneForAction(action);
  save();
  showHud();
  if ($('sheetWrap').classList.contains('open')) drawPanel(true);
}
function setSceneForAction(action) {
  // Gentle transient effects only; no permanent replacement for the main world.
  $('screen').dataset.action = action;
  clearTimeout(sceneTimer);
  sceneTimer = setTimeout(() => { delete $('screen').dataset.action; }, 3400);
}
function updateTime() {
  const date = new Date();
  $('timeText').textContent = date.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' });
  $('todayDate').textContent = date.toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' });
  advanceDay(game, date);
  let scene = 'day';
  const hour = date.getHours();
  if (hour >= 21 || hour < 7) scene = 'night';
  else if (hour >= 18 || hour < 9) scene = 'dusk';
  if (scene !== currentScene) {
    currentScene = scene;
    $('screen').dataset.scene = scene;
    $('landscape').style.backgroundImage = `url('./assets/backgrounds/meadow_${scene}.png')`;
  }
  updateFireflyTarget();
  updatePetalTarget();
  maybeReminder(date);
}
function maybeReminder(now) {
  const s = game.settings;
  if (!s.waterReminder || now.getHours() < 9 || now.getHours() >= 22) return;
  if (!s.nextWaterAt) {
    s.nextWaterAt = Date.now() + s.waterMinutes * 60_000;
    save();
    return;
  }
  if (Date.now() >= s.nextWaterAt) {
    s.nextWaterAt = Date.now() + s.waterMinutes * 60_000;
    say('💧 Une petite pause eau, si tu en as envie ♡');
    save();
  }
}
function animate(now) {
  const dt = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;
  pony.update(dt, now, game.pet);
  needAccumulator += dt;
  if (needAccumulator >= 60) {
    const minutes = Math.floor(needAccumulator / 60);
    needAccumulator -= minutes * 60;
    decayNeeds(game, minutes);
    if (hudOpen) refreshStats();
    save();
  }
  if (Date.now() - lastSaved > 15_000) {
    lastSaved = Date.now();
    save();
  }
  requestAnimationFrame(animate);
}

$('screenTap').addEventListener('click', () => hudOpen ? hideHud() : showHud());
$('fireflyTap').addEventListener('click', () => {
  const result = followFirefly(game, new Date());
  if (!result.ok) { updateFireflyTarget(); return; }
  fireflyFeedbackUntil = Date.now() + (result.found ? 900 : 650);
  pony.direction = result.step === 1 ? 1 : -1;
  pony.action('curious', result.found ? 1600 : 1200);
  const message = result.found
    ? 'La luciole s’élève dans les étoiles… Rosy garde ce souvenir. ✨'
    : 'La luciole s’envole de l’autre côté… suis-la encore !';
  $('statusPetal').textContent = message;
  say(message);
  const memory = collectMeadowMemory(game);
  if (memory.collected) say('📖 Nouveau souvenir dans l’album du pré !');
  updateFireflyTarget();
  save();
  setTimeout(() => {
    fireflyFeedbackUntil = 0;
    updateFireflyTarget();
  }, result.found ? 950 : 700);
});
$('petalTap').addEventListener('click', () => {
  if (Date.now() < petalFeedbackUntil) return;
  const result = followPetal(game, new Date());
  if (!result.ok) { updatePetalTarget(); return; }

  const duration = result.complete ? 780 : 540;
  petalVisualStep = result.step - 1;
  petalFeedbackUntil = Date.now() + duration;
  pony.direction = result.step === 2 ? 1 : -1;
  const poses = ['curious', 'sniff', 'play'];
  const messages = [
    'Un pétale rose s’envole… Rosy le suit du regard. 🌸',
    'Le vent emporte le pétale plus loin… Rosy le renifle doucement. 🍃',
    'Trois pétales retrouvés ! Rosy fait une petite danse. ✨',
  ];
  pony.action(poses[result.step - 1], result.complete ? 1800 : 1250);
  $('statusPetal').textContent = messages[result.step - 1];
  say(messages[result.step - 1]);
  const memory = collectMeadowMemory(game);
  if (memory.collected) say('📖 Nouveau souvenir dans l’album du pré !');
  updatePetalTarget();
  save();

  clearTimeout(petalFeedbackTimer);
  petalFeedbackTimer = setTimeout(() => {
    petalFeedbackUntil = 0;
    petalVisualStep = result.step;
    updatePetalTarget();
  }, duration);
});
$('petTap').addEventListener('click', (event) => {
  const button = $('petTap');
  const bounds = button.getBoundingClientRect();
  const reaction = petRosy(pettingState, {
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top,
    width: bounds.width,
    height: bounds.height,
  }, performance.now());
  if (!reaction.accepted) return;

  pettingState = reaction.state;
  game.pet.happiness = clamp(game.pet.happiness + reaction.happiness);
  pony.pet(reaction.pose, reaction.duration);
  $('statusPetal').textContent = reaction.message;
  say(reaction.message);

  button.dataset.zone = reaction.zone;
  button.style.setProperty('--pet-x', `${reaction.x}px`);
  button.style.setProperty('--pet-y', `${reaction.y}px`);
  button.classList.remove('pet-burst');
  void button.offsetWidth;
  button.classList.add('pet-burst');
  clearTimeout(petBurstTimer);
  petBurstTimer = setTimeout(() => button.classList.remove('pet-burst'), 800);

  showHud();
  save();
});
for (const button of document.querySelectorAll('[data-care]')) button.addEventListener('click', () => careForRosy(button.dataset.care));
$('openMenu').addEventListener('click', () => showPanel('missions'));
$('sheetScrim').addEventListener('click', closePanel);
$('closeSheet').addEventListener('click', closePanel);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('sheetWrap').classList.contains('open')) closePanel(); });
for (const button of document.querySelectorAll('[data-tab]')) button.addEventListener('click', () => {
  panelTab = button.dataset.tab;
  drawPanel();
});
$('sheetContent').addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (!button) return;
  if (button.hasAttribute('data-album-day')) {
    const day = button.dataset.albumDay;
    if (game.meadowAlbum?.includes(day)) {
      selectedAlbumDay = day;
      drawPanel(true);
    }
    return;
  }
  if (button.hasAttribute('data-memory-start')) {
    clearTimeout(memoryHintTimer);
    const pairCount = Number(button.dataset.memoryStart) === 4 ? 4 : 3;
    memoryRound = createMemoryRound(Math.random, pairCount);
    drawPanel();
    return;
  }
  if (button.hasAttribute('data-memory-hint')) {
    const result = revealMemoryHint(memoryRound);
    if (result.result === 'hint') {
      memoryRound = result.round;
      reactToMemory('hint', memoryRound.hintsUsed);
      drawPanel(true);
      clearTimeout(memoryHintTimer);
      memoryHintTimer = setTimeout(() => {
        memoryRound = clearMemoryHint(memoryRound);
        if (panelTab === 'memory' && $('sheetWrap').classList.contains('open')) drawPanel(true);
      }, 1500);
    }
    return;
  }
  if (button.hasAttribute('data-memory-card')) {
    clearTimeout(memoryHintTimer);
    const result = revealMemoryCard(memoryRound, Number(button.dataset.memoryCard));
    memoryRound = result.round;
    if (result.result === 'match' || result.result === 'mismatch') {
      reactToMemory(result.result, memoryRound.moves - 1);
    } else if (result.result === 'complete') {
      const payout = recordMemoryWin(game.daily, (reward) => grant(game, reward));
      reactToMemory('complete', memoryRound.moves, payout.rewarded ? ' +12 étoiles et +15 XP.' : '');
      save();
    }
    drawPanel(true);
    return;
  }
  if (button.dataset.quest) {
    const type = button.dataset.quest;
    const result = completeQuest(game, type);
    if (result.ok) {
      say(`✦ Bravo ! +${result.reward.stars} étoiles`);
      if (result.bonus) say('🌸 Bonus : trois repas notés !');
      drawPanel(true);
      save();
    }
  }
  if (button.dataset.buy) {
    const result = buyOrEquip(game, button.dataset.buy);
    if (result.ok) { setAccessory(); drawPanel(true); say('🎀 ' + result.item.label + ' équipé !'); save(); }
  }
  if (button.dataset.reset === 'true') {
    if (window.confirm('Effacer les quêtes, le niveau et les accessoires de ce navigateur ?')) {
      try { localStorage.removeItem('ponygotchi_v08'); } catch { /* private mode */ }
      location.reload();
    }
  }
});
$('sheetContent').addEventListener('change', (e) => {
  if (e.target.id === 'reminderToggle') {
    game.settings.waterReminder = e.target.checked;
    game.settings.nextWaterAt = Date.now() + game.settings.waterMinutes * 60_000;
    save();
  }
  if (e.target.id === 'reminderInterval') {
    game.settings.waterMinutes = Number(e.target.value);
    game.settings.nextWaterAt = Date.now() + game.settings.waterMinutes * 60_000;
    save();
  }
});

setAccessory();
updateTime();
refreshStats();
setInterval(updateTime, 1000);
requestAnimationFrame(animate);
