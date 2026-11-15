# Daft Punk — Concert Tonight

Prototype autonome de compagnon musical pour le CrowPanel DIS05035H V2.2.

## Boucle de jeu

Pendant la journée, les deux robots préparent leur prochain concert. Le joueur accomplit des missions pour remplir trois jauges indépendantes :

- **Moral** : énergie, complicité et enthousiasme des robots.
- **Musique** : préparation du set, rythmes et transitions.
- **Inspiration** : idées de scénographie, lumières et surprises.

Lorsque les trois jauges atteignent 100 %, le bouton de concert se déverrouille. Le concert devient le moment fort de la session.

## Prototype jouable

Ouvrir `index.html` dans un navigateur. La démo permet de terminer six missions, de remplir les trois jauges et de déclencher l'écran de concert. La progression est volontairement une simulation de démonstration : elle n'est pas encore sauvegardée et les quêtes ne sont pas encore liées à l'heure réelle.

## Direction artistique

- Univers nocturne de coulisses, scène électronique, LEDs, lasers et panneaux lumineux.
- Deux silhouettes robotiques originales dessinées en CSS pour le prototype.
- Interface portrait conçue pour 320 × 480 pixels.
- Animations sobres pour préserver les ressources de l'ESP32.
- Aucun extrait musical commercial intégré ; les premiers sons seront des créations originales synthétiques ou des fichiers pour lesquels les droits sont disponibles.

## Assets Internet Bee

Référence : https://internetbee.neocities.org/archive/2024/featured_051224

La page présente neuf sprites animés des différentes ères visuelles de Daft Punk. La licence affichée est **CC BY-NC-ND 4.0**. En conséquence, ce dépôt ne copie, ne modifie et ne redistribue pas ces images. Leur intégration éventuelle nécessite de respecter les conditions applicables et d'obtenir une autorisation lorsque nécessaire. Le prototype utilise des silhouettes CSS originales en attendant.

## Portage CrowPanel — étapes suivantes

1. Séparer le moteur de progression de l'interface.
2. Porter l'affichage vers le pilote ILI9488 du CrowPanel (320 × 480).
3. Remplacer les éléments DOM par des composants graphiques légers.
4. Ajouter sauvegarde locale des jauges et missions terminées.
5. Concevoir un catalogue de quêtes renouvelées quotidiennement, sans pénalité si une journée est manquée.
6. Ajouter une séquence de concert avec animation de scène et sons originaux.
7. Vérifier la mémoire PSRAM, la fluidité et le tactile en simulation puis sur appareil.

## Sécurité et isolation

Ce projet reste dans `experiments/daft-punk-concert-companion/`. Il ne modifie pas les sources, les sauvegardes, les assets ou la configuration de PonyGotchi. Aucun flash matériel, formatage SD ou effacement n'est effectué.

## Statut

Prototype navigateur jouable créé. Portage firmware et validation physique non réalisés.
