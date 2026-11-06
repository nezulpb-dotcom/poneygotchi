# 🦄 PonyGotchi v0.8 — Projet prêt pour Codex

**Un compagnon virtuel rose, en pixel art féerique, pensé pour un écran vertical de 320 × 480 pixels.** La priorité n'est pas un tableau de bord mais une scène vivante : Rosy se déplace sous une horloge ; le joueur touche l'écran pour faire apparaître une interface secondaire discrète.

## ✨ Démarrer sur PC

**Le plus simple — sans rien installer :** double-clique sur `preview-offline.html`. Ce fichier contient les images, les styles et le code nécessaires pour tester la version actuelle **sans Internet**.

**Pour développer avec Codex (projet source modulaire) :**

1. Décompresse l'archive et ouvre le dossier `PonyGotchi_Codex_v0.8` dans Codex / VS Code.
2. Installe **Node.js 20 ou supérieur** si nécessaire (aucune dépendance npm à installer).
3. Dans le terminal du projet, lance `npm run dev`.
4. Ouvre `http://127.0.0.1:4173/` dans ton navigateur.
5. Lance `npm test` pour vérifier la logique du jeu.
6. Après modification des sources, reconstruis la version standalone : `python scripts/build_preview.py` (nécessite Python 3, sans bibliothèque additionnelle).

> Ne pas double-cliquer sur `index.html` pour exécuter les modules JavaScript : les navigateurs bloquent généralement les `import` en `file://`. Utilise `preview-offline.html` ou le serveur de développement.

## 🎮 Comment jouer

- **Au repos :** décor féerique, heure et date de ton PC, Rosy indépendante du fond qui marche, s'arrête et cligne des yeux.
- **Touche ou clique le paysage :** ouvre le petit HUD. Les besoins sont représentés par des cœurs, les quatre actions apparaissent en bas.
- **Touche Rosy :** elle réagit aux caresses.
- **Nourrir, Jouer, Dormir, Laver :** ces actions modifient ses besoins et ses animations. Le HUD se masque automatiquement après quelques secondes sans interaction.
- **Quêtes · Atelier · Niveau :** ouvre les vues détaillées dans un panneau inférieur, uniquement quand tu le souhaites.
- **Quêtes réelles :** petits repas, eau, activité, pause facultatifs ; étoiles et XP, sans pénalité.
- **Sauvegarde :** les données sont enregistrées dans le navigateur avec `localStorage` lorsque celui-ci l'autorise.

## 📁 Structure du projet

```text
PonyGotchi_Codex_v0.8/
├── AGENTS.md                   # Instructions automatiques pour Codex
├── README.md                   # Ce guide
├── index.html                  # Point d'entrée du simulateur modulaire
├── preview-offline.html        # Démo autonome : double-clic, hors ligne
├── package.json               # npm run dev, npm test
├── src/
│   ├── main.js                # Orchestration UI et interactions
│   ├── styles.css             # Portrait / lockscreen / HUD / panneau
│   ├── core/
│   │   ├── game.js            # Besoins, ressources, niveaux, quêtes, achats
│   │   └── storage.js         # Sauvegarde locale
│   ├── graphics/
│   │   └── pony.js            # Comportements et animations de Rosy
│   └── ui/
│       └── panels.js          # HUD et panneaux détaillés
├── assets/
│   ├── references/            # TES DEUX images de référence fournies
│   ├── backgrounds/           # 3 décors + source de haute résolution
│   └── ponies/rosy/           # 32 sprites PNG transparents
├── docs/
│   ├── CAHIER_DES_CHARGES_V08.md
│   ├── ARCHITECTURE.md
│   ├── PROMPT_CODEX.md
│   ├── HERITAGE.md
│   └── preview_*.png          # Captures de validation
├── scripts/
│   ├── serve.mjs              # Serveur web local sans dépendance
│   ├── build_preview.py      # Reconstruit le HTML autonome
│   ├── generate_sprites.py   # Sprites originaux modifiables
│   └── prepare_backgrounds.py
└── tests/
    ├── game.test.mjs         # Tests unitaires
    └── browser-smoke.py      # Smoke test navigateur (optionnel)
```

## 📐 Références UI / UX — À respecter impérativement

- `assets/references/01_lockscreen_user.png` : **source de vérité pour l'accueil**. Un grand paysage de rêve, un animal au centre et l'heure / date en haut, très peu d'information visible.
- `assets/references/02_compact_ui_user.png` : **source de vérité pour l'état interaction**. Cœurs et infos discrètes en haut, petits boutons en bas, personnage visible et espace central dégagé.

Les références sont fournies à titre de direction artistique. Les assets jouables sont des créations originales séparées ; aucune partie de l'image n'a été découpée illégalement pour simuler un sprite.

## 🔍 Ce qui est réalisé, et ce qui reste à faire

**Inclus et jouable :** écran de verrouillage, 32 images de Rosy (8 animations × 4 frames), déplacements autonomes, heure/date PC, mini HUD tactile, boutons, besoins, XP, étoiles, achats, habitudes facultatives, rappels d'eau pendant la session, sauvegarde locale, décor jour / crépuscule / nuit.

**À améliorer :** qualité expressive des sprites et transitions, interactions tactiles calibrées pour le vrai CrowPanel, salles intérieures réellement distinctes, audio, meilleure persistance entre navigateur et ESP32. Le firmware ESP32 **n'est pas encore intégré** à cette version PC.

**Important :** les fichiers HTML des prototypes v0.1–v0.7 ne sont pas récupérables sous forme source dans cette session. Ce projet reprend **leurs fonctionnalités et leur architecture souhaitée**, mais le code est **une réécriture modulaire** plutôt qu'une copie bit à bit. Voir `docs/HERITAGE.md`.

## 🤖 Pour Codex

Codex lit `AGENTS.md` comme instructions de travail du projet. Consulte ensuite `docs/CAHIER_DES_CHARGES_V08.md` et copie le prompt de `docs/PROMPT_CODEX.md` pour commencer. **Ne jamais remplacer le lockscreen par un écran rempli de cartes ou de statistiques.**

## Confidentialité et bien-être

Les missions de repas, d'eau et de pause sont facultatives, non médicales et ne requièrent aucune quantité ou horaire. Pas de pénalité pour une journée non terminée. Aucun compte, aucun serveur et aucune télémétrie dans la version actuelle.
