# Vérification réalisée lors de l'assemblage

- `npm test` : **8 tests réussis** sur le moteur (faim, quêtes, bonus, eau, boutique, niveaux, restauration).
- `python scripts/build_preview.py` : **OK**, produit un HTML autonome contenant le même code source et ses assets.
- `python tests/browser-smoke.py` : **OK** sous Chromium headless. Vérifications : accueil sans HUD, clic sur fond → HUD, Nourrir, menu secondaire, atelier, quêtes, aucune erreur JavaScript non interceptée.
- Captures du jeu 320×480 : `docs/preview_lockscreen.png`, `docs/preview_hud.png`, `docs/preview_sheet.png`.

**Limites de validation :** tests effectués sur le navigateur de l'environnement de préparation. Le projet n'a pas été flashé ni testé sur le CrowPanel ESP32 réel. Les images de référence utilisateur ont servi de contraintes artistiques, pas d'assets de gameplay.
