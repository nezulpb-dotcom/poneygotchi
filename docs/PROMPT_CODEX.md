# Prompt prêt à coller dans Codex

> Je travaille sur PonyGotchi v0.8. Lis d'abord `AGENTS.md`, `docs/CAHIER_DES_CHARGES_V08.md` et examine **les deux images** `assets/references/01_lockscreen_user.png` et `assets/references/02_compact_ui_user.png`. Ne commence pas par une réécriture générique.
>
> Objectif : améliorer l'interface **sans perdre** son architecture à trois niveaux : (1) lockscreen féerique avec heure/date et Rosy animée, aucun HUD permanent ; (2) HUD compact au toucher inspiré de l'image 2, cœurs et quatre actions discrètes ; (3) menus de quêtes, atelier, niveau accessibles dans une feuille secondaire.
>
> Exécute `npm test`, teste le simulateur au format 320×480, inspecte les captures `docs/preview_lockscreen.png`, `docs/preview_hud.png` et les deux références. Identifie visuellement les écarts et corrige en priorité la taille / qualité de Rosy, le placement des statuts et la discrétion de l'interface. Conserve le moteur de jeu (XP, étoiles, quêtes facultatives, sauvegarde) et les assets en fichiers indépendants. Ne remplace pas les références par une image contenant UI et personnage figés.
>
> Après modification, exécute les tests, reconstruis `preview-offline.html` et donne un bref bilan avec captures avant/après et limites connues. N'ajoute pas de dépendance sans nécessité. Pour le CrowPanel, reste au stade de notes tant que la révision matérielle n'est pas confirmée.
