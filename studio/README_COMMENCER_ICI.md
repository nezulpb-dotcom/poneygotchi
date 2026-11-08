# PonyGotchi Studio — version expérimentale 1.2

Bienvenue dans une version plus ambitieuse de PonyGotchi, construite sur les paysages
et les sprites originaux du projet. Comprend une preview HTML hors ligne et un
firmware CrowPanel expérimental avec un transfert USB des assets.

## Pour voir le jeu sur ordinateur (aucune installation)

Double-cliquer sur `PonyGotchi_Studio_Preview.html`. Tous les PNG sont intégrés :
le fichier fonctionne hors ligne avec Chrome, Edge et Firefox récents.

- Toucher le paysage pour révéler les soins ; toucher Rosy pour la caresser.
- Soins : Manger / Jouer / Laver / Dormir / Câlin.
- Journal : déclarer volontairement les petites missions de la journée.
- Atelier : utiliser les étoiles pour acheter et équiper des accessoires.
- Explorer : découvrir huit petits trésors.
- Jeux : attraper des étoiles dans un mini-jeu tactile.
- Paramètres : heure/date manuelles, cycle du jour, mode doux, luminosité.
- Les boutons latéraux de la page permettent de prévisualiser le jour et la nuit.
- Une sauvegarde est créée localement par le navigateur. Exporter/importer un JSON
  permet de la conserver et de la déplacer vers un autre navigateur.

## Pour tester sur CrowPanel

Ouvrir `CrowPanel/INSTALLATION_WINDOWS.txt` et suivre les instructions dans l'ordre.
N'utiliser que le matériel indiqué (CrowPanel Elecrow 3.5 V2.2, ESP32-WROVER-B).

Les 11 fichiers du dossier `CrowPanel/sd_files` doivent être transférés par USB
après installation du firmware. Les assets occupent environ 3,7 Mo sur microSD.

**Prudence : la variante CrowPanel n'a pas été compilée dans Arduino IDE ni
validée physiquement.** Conserver une copie de la bêta qui fonctionnait avant
le flash de cette nouvelle variante. La preview HTML, elle, a été exécutée
avec des tests automatisés des principaux parcours.

## Dossiers

- `PonyGotchi_Studio_Preview.html` : jeu PC portable complet.
- `src/` : HTML/CSS/JavaScript source, séparés pour pouvoir modifier le projet.
- `assets/bg/` : paysages originaux 320x480.
- `assets/rosy/` : 32 sprites 144x144.
- `assets/rooms/` : nouvelles scènes d'action transparentes.
- `assets/ui/` : panneaux Cozy et icônes pixel art.
- `CrowPanel/PonyGotchi_Studio_CrowPanel/` : sketch Arduino + heure manuelle.
- `CrowPanel/sd_files/` : ressources RGB565 prêtes à transférer.
- `CrowPanel/envoyer_tout.py` : transfert USB sans lecteur microSD.
- `docs/RECHERCHE_ET_DECISIONS.md` : analyse des jeux similaires et des retours Reddit.

## Notes importantes

- Aucun compte, Wi-Fi ou mot de passe n'est nécessaire.
- Les missions liées aux habitudes de vie sont purement facultatives, non médicales.
- Le mode Doux est activé par défaut, sans punition en cas d'absence.
- Ne pas diffuser publiquement les graphismes du pack Cozy sans vérifier sa licence.
