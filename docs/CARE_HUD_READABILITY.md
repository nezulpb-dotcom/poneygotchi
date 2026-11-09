# Soins plus lisibles — CrowPanel 320 × 480

Cette évolution répond au problème des jauges trop petites sur le vrai CrowPanel
DIS05035H V2.2.

## Changements

- L'accueil reste un écran verrouillé féerique : **aucune jauge permanente**.
- L'ouverture du menu de soins présente toujours les quatre actions à 73 × 47 px.
- Les quatre jauges de santé passent de **50 px** (bande étroite en haut) à
  **124 px** dans un panneau 2 × 2 sous Rosy.
- Le panneau occupe y=338..422. Rosy est rendue dans y=185..329 :
  **aucune superposition**.
- Une petite en-tête avec accès au Menu reste à y=130..182.
- Fermer le menu de soins efface proprement les deux panneaux en restaurer
  les lignes du background, sans masquer l'animation ni repeindre l'écran entier.
- Toucher une jauge ne ferme plus le panneau accidentellement.
- Les boutons Manger, Jouer, Laver et Dormir conservent leurs positions et tailles.

Les ressources microSD, les trois backgrounds, les sprites, le système de
sauvegarde et la calibration du tactile ne sont pas modifiés.

## Validation

Tests du dépôt :

```sh
npm test
g++ -std=c++11 -Wall -Wextra -Werror tests/care_layout_test.cpp -o care_layout_test
./care_layout_test
```

Le test C++ autonome des coordonnées et du tactile a été reproduit et
exécuté avec succès dans l'environnement d'intégration. Les vérifications
statiques du véritable code publié sur GitHub montrent des dimensions
cohérentes et aucune superposition.

**Non vérifié ici :** compilation du firmware Arduino ESP32 2.0.17, tests
de toucher physique ou mesures de fluidité sur le CrowPanel.

Avant installation matérielle, récupérer cette branche dans l'environnement
Codex Windows du projet, compiler le sketch avec sa configuration TFT_eSPI
validée, puis utiliser le flux d'installation firmware-only après vérification
des 11 ressources microSD. Ne pas réinstaller des fichiers .raw non modifiés.

## Vérification sur l'appareil

Ouvrir Soins depuis l'accueil. Confirmer quatre jauges lisibles et
quatre boutons accessibles, une réaction au toucher de Rosy, le passage
au Menu, la fermeture automatique du HUD et la restauration du décor
sans scintillement. Tester avec jour, crépuscule et nuit.

Cette branche est basée sur `feat/exploration-discoveries`, qui inclut
aussi les PR précédentes. Elle ne doit pas être fusionnée dans `main`
sans intégration et validation du firmware le plus récent localement.
