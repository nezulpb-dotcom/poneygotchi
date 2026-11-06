# Héritage des prototypes antérieurs

Le projet reprend les fonctionnalités développées au fil des versions précédentes de PonyGotchi, mais **le code source exact des HTML v0.1–v0.7 n'était pas accessible lors de la préparation de cette archive**. Il ne s'agit donc pas d'une copie inchangée de ces fichiers : c'est une **base modulaire neuve** qui réimplémente les fonctionnalités discutées.

Correspondance :

| Anciennes versions | Nouvelle organisation |
| --- | --- |
| Stats de Rosy (faim, joie, énergie, propreté) | `src/core/game.js` |
| Évolution des besoins et sauvegarde | `src/core/game.js`, `src/core/storage.js` |
| Animations du poney et déplacement | `src/graphics/pony.js`, assets PNG par état |
| Récompenses / XP / niveaux / accessoires | `src/core/game.js`, `src/ui/panels.js` |
| Quêtes repas, eau, activité, pause | `src/core/game.js` |
| Portrait 320×480 et horloge | `index.html`, `src/styles.css`, `src/main.js` |
| Gestion du menu secondaire | `src/ui/panels.js`, `src/main.js` |

Cette v0.8 corrige intentionnellement le problème UI/UX majeur des anciennes démos : les stats et boutons ne sont plus visibles sur l'accueil de façon permanente. Les sources sont maintenant structurées et adaptées à Codex.
