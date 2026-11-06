import { loadGame, saveGame } from './core/storage.js';
import { advanceDay, buyOrEquip, care, completeQuest, decayNeeds, ITEMS, grant, clamp } from './core/game.js';
import { PonyAnimator } from './graphics/pony.js';
import { renderMiniStats, renderPanel } from './ui/panels.js';

const $ = (id) => document.getElementById(id);
const game = loadGame();
const pony = new PonyAnimator($('ponySprite'));
let hudOpen = false;
let panelTab = 'missions';
let hudHideTimer;
let bubbleTimer;
let sceneTimer;
let lastFrame = performance.now();
let needAccumulator = 0;
let lastSaved = Date.now();
let currentScene = '';

function save() { game.updatedAt = Date.now(); saveGame(game); }
function refreshStats() { $('miniStats').innerHTML = renderMiniStats(game.pet); }
function say(message) {
  $('bubble').textContent = message;
  $('bubble').classList.add('visible');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => $('bubble').classList.remove('visible'), 2400);
}
function hideHud() {
  hudOpen = false;
  clearTimeout(hudHideTimer);
  $('hud').classList.remove('open');
  $('screen').classList.remove('hud-active');
  $('hud').setAttribute('aria-hidden', 'true');
}
function showHud() {
  hudOpen = true;
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
  box.innerHTML = renderPanel(panelTab, game);
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
    $('landscape').style.backgroundImage = `url('./assets/backgrounds/meadow_${scene}.png')`;
  }
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
$('petTap').addEventListener('click', () => {
  game.pet.happiness = clamp(game.pet.happiness + 2);
  pony.pet();
  say('♡ Rosy adore les caresses !');
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
