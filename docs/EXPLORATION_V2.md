# PonyGotchi — exploration avec découvertes

Cette itération enrichit le CrowPanel sans ajouter de ressources sur la microSD.

## Gameplay

- Huit souvenirs existants, mais l'ordre de découverte varie d'une partie à l'autre.
- Aucune répétition avant d'avoir complété les huit souvenirs.
- Après la collection complète, Rosy peut retrouver des souvenirs déjà connus.
- Nouvelle découverte : **+20 XP et +10 étoiles**.
- Souvenir déjà connu : **+6 XP et +3 étoiles**.
- Un bandeau discret apparaît brièvement sur l'écran d'accueil en fin de balade.
- Le journal d'exploration affiche la dernière découverte et reste accessible.

La sauvegarde existante est conservée : le même masque `finds`, l'expérience,
les étoiles et le nombre de visites continuent à être utilisés. Les valeurs
de masque corrompues sont bornées aux huit bits reconnus.

## Compatibilité

- Ecran : CrowPanel DIS05035H V2.2, ILI9488, 320 x 480.
- Aucune modification aux trois fonds, à `rosy.raw`, à la calibration, aux partitions ou aux 11 fichiers microSD.
- Aucun changement apporté aux autres mini-jeux et soins.
- Le bandeau disparaît après quatre secondes, sans effacer la zone du personnage.
- Le code utilise exclusivement les outils Arduino/TFT déjà utilisés par le jeu.

## Test portable

Depuis la racine du dépôt, avec un compilateur C++ :

```sh
g++ -std=c++11 -Wall -Wextra -Werror tests/exploration_rules_test.cpp -o exploration_rules_test
./exploration_rules_test
```

Le test C++11 vérifie tous les masques de collection (256 possibilités),
des sélections pseudo-aléatoires, les récompenses et l'absence de doublons.
Il a été exécuté sur un compilateur C++ hôte.

## Vérifications encore nécessaires

La **compilation Arduino ESP32 et l'essai matériel** restent à effectuer
sur la machine Windows du projet. Avant toute installation, utiliser la
chaîne Arduino déjà validée et ne flasher que le binaire réellement compilé.

Vérifier sur l'appareil : les transitions de l'animation pendant la balade,
la notification de découverte à la fin, l'affichage dans le journal et la
persistance de la collection après redémarrage.

Cette branche suit `fix/rosy-animation-fallback-diagnostics` pour
conserver le correctif des animations. Intégrer prudemment dans
`fix/studio-compositing-care` si ce correctif y a déjà été fusionné localement.
