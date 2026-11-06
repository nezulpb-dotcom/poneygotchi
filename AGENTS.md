# Instructions du dépôt — PonyGotchi v0.8

Tu travailles sur un simulateur de compagnon virtuel en HTML / CSS / JavaScript natif, précurseur du firmware CrowPanel ESP32 3.5". **Lis d'abord** `docs/CAHIER_DES_CHARGES_V08.md` et examine les deux images `assets/references/01_lockscreen_user.png`, `02_compact_ui_user.png` avant toute modification de l'UI.

## Priorité visuelle non négociable

1. Écran initial = fond plein écran féerique, Rosy indépendante du fond qui bouge, heure, date. **Aucun HUD, panneau, jauge, onglet, monnaie, barre de navigation ou bouton de gestion visible au repos.** Un cœur discret peut aider à découvrir l'interaction.
2. Au toucher / clic = mini-HUD compact inspiré de la référence 02. Petits cœurs / icônes d'état en haut ; quatre petites actions en bas ; Rosy reste visible et ne doit pas disparaître derrière le menu.
3. Menus approfondis (quêtes, accessoires, niveaux, réglages) = feuille secondaire dépliable, fermable. Pas de tableau de bord en permanence.
4. Les images du personnage doivent être séparées du fond. Ne pas construire le jeu autour d'une image « maquette complète » contenant l'heure, Rosy et les boutons figés.
5. Garder le viewport 320 × 480 et examiner les captures `docs/preview_lockscreen.png` / `preview_hud.png` après modification.

## Architecture et tests

- Conserver la séparation `src/core` (règles et progression), `src/graphics` (animation), `src/ui` (menus), `src/main.js` (contrôleur).
- Aucun framework ou dépendance runtime ne doit être ajouté sans nécessité démontrée. `npm run dev` lance un serveur local Node.js sans dépendance.
- À chaque modification JS : `npm test`, puis si possible `python scripts/build_preview.py` et `python tests/browser-smoke.py` (Playwright/Chromium sont des dépendances de test facultatives).
- Si un test ne peut pas être exécuté, le signaler clairement. Ne jamais déclarer « testé » sans avoir exécuté les vérifications.
- Garder `preview-offline.html` synchronisé avec les sources lorsque possible ; il est généré et ne doit pas être édité manuellement.
- Ne jamais exposer ni stocker des mots de passe, clés API, données santé ou compte utilisateur.

## Gameplay et principes de bien-être

- Faim, bonheur, énergie, propreté, XP, niveaux, étoiles, inventaire et quêtes quotidiennes sont persistants localement.
- Missions de vie réelle **facultatives** : repas, hydratation, mouvement, pause. Aucune quantité prescrite, aucune punition ou pression pour les objectifs manqués, pas de « streak » culpabilisant, pas de messages médicaux.
- Limiter les récompenses d'hydratation à trois confirmations par jour ; ne pas déclencher de rappel si l'utilisateur ne l'a pas activé ; pas d'alertes entre 22 h et 9 h.
- Sauvegarde locale seulement pour la v0.8. Les contrôles de tempo accélèrent le temps de jeu uniquement, jamais la santé de l'utilisateur.

## Assets

- Les deux images dans `assets/references` sont des références fournies par l'utilisateur ; **ne pas les publier comme graphismes du jeu, ni présumer leur licence**.
- Les sprites et décors du dossier `assets` sont des créations originales. Ne pas importer d'assets Internet sans licence documentée et autorisation de redistribution.
- Pour le portage CrowPanel, créer une couche de rendu distincte ; ne pas supposer la révision GPIO, les broches tactiles ou les paramètres de l'écran sans validation matérielle.

## Approche Codex recommandée

Faire une amélioration mesurable à la fois. Avant de modifier, décrire l'écart par rapport aux deux références. Après, montrer deux captures : verrouillage et mini-HUD ; vérifier qu'il n'y a pas de console errors. Favoriser des changements ciblés, pas une réécriture de toute l'interface.
