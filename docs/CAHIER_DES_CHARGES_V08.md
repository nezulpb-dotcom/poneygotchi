# Cahier des charges — PonyGotchi v0.8

## Vision

Créer un **compagnon de poche apaisant** sur un écran vertical 320 × 480 : Rosy, un petit poney rose original, se promène dans un monde pixel art pastel. L'expérience principale ressemble à un écran de verrouillage de téléphone, pas à un jeu de gestion surchargé. Un geste révèle une interface de soin minimale ; les menus détaillés apparaissent seulement à la demande.

### Deux références utilisateur prioritaires

**A. `assets/references/01_lockscreen_user.png`** : style d'accueil. Paysage pastel, heure/date intégrées, personnage vivant au milieu / en bas, respiration visuelle généreuse. Référence d'ambiance, pas écran à reproduire pixel par pixel ni image à recopier.

**B. `assets/references/02_compact_ui_user.png`** : style une fois l'écran touché. Statuts en quelques icônes / cœurs, personnage au centre, quatre actions minuscules en bas. La stat doit apparaître discrètement et le personnage doit rester le point focal.

## Flux d'interaction précis

```text
LOCKSCREEN (défaut)
  heure/date + fond riche + Rosy animée
  tap / clic sur fond → HUD COMPACT
  tap / clic sur Rosy → réaction + HUD COMPACT

HUD COMPACT (second état)
  cœurs 3 niveaux x 4 besoins + 4 actions sous le décor
  tap « Nourrir » → animation repas, faim ↑, éventuellement XP
  tap « Jouer » → joie ↑, énergie ↓, XP
  tap « Dormir » → animation sommeil, énergie ↑
  tap « Laver » → animation toilette, propreté ↑
  tap extérieur → lockscreen
  9 s d'inactivité → lockscreen
  tap « Quêtes · Atelier · Niveau » → FEUILLE SECONDAIRE

FEUILLE SECONDAIRE (troisième état)
  onglets Quêtes / Atelier / Niveau / Réglages
  peut défiler ; se ferme via croix, fond ou Échap
  à sa fermeture → HUD, puis lockscreen
```

## Contraintes fortes

- Canvas / zone de jeu : 320 × 480 en portrait, adaptée aux écrans PC en respectant le ratio 2:3.
- L'heure provient du PC et le fuseau est celui du système ; la version future ESP32 utilisera une source d'heure synchronisée.
- Le poney est un **sprite indépendant**, en PNG transparent, indépendant du background. Les animations doivent rester cohérentes avec son orientation et son mouvement.
- Les assets peuvent être remplacés facilement sans changer les règles du jeu.
- Les décors peuvent suivre la journée (jour, crépuscule, nuit). Pour des actions plus longues, conserver l'existence d'un « chez soi ».
- Aucun score, barre de jauge, section Quêtes/Atelier, ni dock permanent sur l'écran verrouillé.
- Éviter le défilement dans l'accueil ; panneau secondaire seul scrollable.
- En arrière-plan, les besoins ne doivent pas se dégrader de façon brutale à la réouverture du navigateur.
- Navigation accessible au clavier, boutons étiquetés, contraste suffisant, support de `prefers-reduced-motion`.

## Fonctionnalités v0.8 à maintenir

1. **Autonomie de Rosy** : repos, marche gauche/droite, clignement, humeur joyeuse/triste, repas, toilette, sommeil, variation de frame et légère pause.
2. **4 jauges** : faim, bonheur, énergie, propreté. Afficher sous forme de quelques cœurs dans le HUD ; pourcentages dans le panneau Niveau.
3. **Progression** : XP, niveaux, seuils croissants, récompense +15 étoiles à chaque niveau.
4. **Économie** : étoiles pour soins (plafond temporel), quêtes quotidiennes (plafonds), achats d'accessoires et équipement.
5. **Bien-être réel facultatif** : trois repas à noter, quelques confirmations d'eau (trois récompenses maximum/jour), mouvement doux, pause. Jamais de quantité prescrite ou de punition si non réalisé.
6. **Rappels d'eau** : opt-in, 60/90/120 minutes, seulement quand la page reste ouverte, jamais de 22h à 9h, pas de notifications système requises.
7. **Sauvegarde** : localStorage du navigateur ; robuste en navigation privée / origine non autorisée ; reset explicite.
8. **Portable** : fonctionne hors ligne via preview autonome, et en développement via serveur local.

## Critères d'acceptation — à cocher après test

- [ ] À l'ouverture, **aucun HUD visible** : seulement heure/date, décor et Rosy.
- [ ] Rosy marche indépendamment du décor et change de pose au fil du temps.
- [ ] Après clic/touch, les cœurs et les 4 actions apparaissent sans cacher Rosy.
- [ ] Le HUD se ferme après inactivité ou clic ailleurs.
- [ ] Nourrir/Jouer/Dormir/Laver modifient des jauges et jouent des états distincts.
- [ ] Quêtes/Atelier/Niveau restent dans un panneau secondaire fermable.
- [ ] Les récompenses ne peuvent pas être collectées en boucle à l'infini.
- [ ] Chaque journée locale renouvelle les quêtes.
- [ ] Activer/désactiver le rappel d'eau fonctionne, sans interruption si désactivé.
- [ ] Fermer/réouvrir l'application conserve ressources et accessoires si le stockage est autorisé.
- [ ] `npm test` passe ; pas d'erreur JS non interceptée pendant les interactions.
- [ ] Une capture 320x480 de l'accueil et du HUD est conservée pour comparaison aux références.

## Priorités pour Codex après réception du projet

**P0** : consolider la fidélité visuelle aux deux références et vérifier les animations des sprites.

**P1** : rendre les expressions plus vivantes (temps de pose, déplacements, réactions, accessoires positionnés avec le sprite), ajouter un HUD plus organique encore.

**P2** : salles de soins et transitions plus détaillées, meilleure personnalisation et petits mini-jeux.

**P3** : préparer portage CrowPanel ESP32 3.5 ILI9488 / microSD ; vérifier la révision physique des broches et la calibration du tactile avant de coder le pilote.

## Non-objectifs pour v0.8

Pas de compte, pas de serveur cloud, pas de connexion à des capteurs de santé, pas de prescription nutritionnelle, pas de firmware ESP32 prétendument testé, pas de copyright d'images de référence réutilisé comme assets de jeu.
