# Architecture

## Vue rapide

- `src/core/game.js` : fonctions synchrones du jeu, sans DOM. Manipulent un état `game` simple : `pet`, `daily`, `inventory`, `settings`.
- `src/core/storage.js` : lecture/écriture localStorage résistante aux exceptions (origine opaque, navigation privée), clé `ponygotchi_v08`.
- `src/graphics/pony.js` : précharge les frames `assets/ponies/rosy/{state}_{frame}.png`; la position du personnage est contrôlée par `.pony-wrap`, sans jamais déplacer le décor.
- `src/ui/panels.js` : construit les fragments du HUD / panneaux Quêtes, Atelier, Niveau, Réglages.
- `src/main.js` : événements utilisateurs, affichage heure/date, variation jour/nuit, état HUD, panneaux, boucles de simulation et rappel facultatif.
- `src/styles.css` : verrouillage 320×480, mini HUD et feuille secondaire qui se déplie.

## Données

```json
{
  "version": 8,
  "pet": {"hunger":82,"happiness":90,"energy":78,"hygiene":88,"level":1,"xp":0,"stars":30},
  "daily": {"date":"YYYY-MM-DD","meals":{"morning":false,"noon":false,"evening":false},"water":0,"movement":false,"pause":false,"mealsBonus":false},
  "inventory": ["none"],
  "equipped": "none",
  "settings": {"waterReminder":false,"waterMinutes":90,"nextWaterAt":0},
  "lastCareAward": {}
}
```

## Temps

- Heure/date PC via `Date` (pas de connexion Internet).
- Animation de Rosy via `requestAnimationFrame` et frames PNG indépendantes.
- Besoins : diminuent seulement pendant l'exécution, par tranches d'une minute.
- Les quêtes se renouvellent au changement de date **locale**.
- Le rappel d'eau suit le temps réel (indépendant du temps accéléré potentiel du jeu).
- Les rappels sont *in-app* seulement, tant que la page est ouverte.

## Développement / distribution

- Code modulaire importé en ES modules : nécessite un contexte serveur.
- `scripts/serve.mjs` : serveur HTTP local Node standard, aucun npm install.
- `scripts/build_preview.py` : petite procédure de génération qui remplace les `import`, embarque les images en base64 et écrit `preview-offline.html` utilisable en double-clic.
- Tests : `npm test` sur les fonctions coeur ; `tests/browser-smoke.py` vérifie les interactions dans Chromium lorsqu'il est installé.

## Portage ESP32 ultérieur

Ne pas tenter de faire tourner le JavaScript du navigateur tel quel sur l'ESP32. Réutiliser les **règles** et **états** (ou un équivalent C++) et les PNG / assets convertis, avec une couche d'abstraction graphique LVGL / TFT_eSPI selon le hardware identifié, gestion de la microSD, heure NTP ou RTC, tactile calibré. Voir `HARDWARE_FUTUR.md`.
