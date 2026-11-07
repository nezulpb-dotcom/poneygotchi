# PonyGotchi 0.10.0 — installation Windows

Cette livraison est une **fondation expérimentale**, compilée pour ESP32 mais jamais testée sur une carte physique par l'agent. Ce n'est pas Studio 1.2, dont le ZIP source reste absent. Réservée au CrowPanel **DIS05035H V2.2 / WROVER-B / ILI9488**, PSRAM activée, flash 4 Mo (à vérifier avant installation).

## Essayer sans matériel

Décompresser complètement le ZIP et ouvrir `preview-offline.html` par double-clic. La preview ne nécessite ni Node ni Internet. Elle permet de vérifier le jeu navigateur ; elle ne simule pas les bus, les couleurs ni les performances du CrowPanel.

## Préparer la carte SD et le PC

1. Conserver une copie du firmware et de la carte SD actuellement fonctionnels.
2. Copier le dossier `SD/ponygotchi` à la racine d'une microSD FAT32 : on doit obtenir `/ponygotchi/bg_day.raw`, etc. Ne pas renommer les fichiers. Éjecter proprement et insérer la carte dans le CrowPanel éteint. Les trois PNG validés sont inchangés ; leurs conversions RGB565 sont incluses.
3. Installer Python **3.12** depuis python.org avec le lanceur `py`. Lancer `Installer.cmd` depuis le dossier décompressé (accès Internet requis pour les outils Python). Les dépendances sont figées dans `requirements-build.txt`.
4. Brancher le CrowPanel par USB. Repérer `COMx` dans le Gestionnaire de périphériques. Fermer le Serial Monitor et tout logiciel utilisant ce port. Installer uniquement le pilote USB officiel correspondant à la puce identifiée si aucun port n'apparaît.

## Sauvegarder et flasher

Lancer `Flasher.cmd`. Il vérifie les SHA256, demande le port COM, affiche l'identification flash et sauvegarde les 4 Mo dans `sauvegarde-avant-flash.bin`. **Si l'identification ne correspond pas à l'ESP32 avec flash 4 Mo, arrêter.** Il exige ensuite de saisir `FLASH` pour écrire le firmware fusionné. Il n'efface pas volontairement la partition NVS ; la sauvegarde binaire et la SD restent néanmoins indispensables. Un flash peut remplacer un ancien firmware et son système de fichiers.

Si la connexion échoue, vérifier le câble USB, fermer les logiciels série et suivre la procédure BOOT/RESET du manuel Elecrow de cette révision. Ne pas utiliser une procédure GPIO générique.

Pour restaurer une sauvegarde de cette même carte, depuis le dossier du ZIP :

```bat
.tools\Scripts\python.exe -m esptool --chip esp32 --port COM5 write_flash 0 sauvegarde-avant-flash.bin
```

Remplacer COM5 par le port réel. Ne pas restaurer une sauvegarde d'une autre carte.

## Premier démarrage

- Toucher les coins indiqués pour calibrer le tactile en portrait. La calibration est stockée en NVS.
- Si la SD, un fichier ou la PSRAM manque, un message explicite remplace le jeu ; lire aussi la sortie série à 115200 bauds.
- Toucher le décor pour ouvrir/fermer le HUD. Les quatre soins jouent une pose distincte. Les menus secondaires donnent accès aux quêtes facultatives, accessoires, progression, découvertes et horloge.
- Dans le menu, le bouton de titre passe à la rubrique suivante et X ferme la feuille.
- L'horloge se règle depuis la rubrique Horloge ou via `TIME 14:30` suivi d'un retour à la ligne sur le port série. La commande `CALIBRATE` relance la calibration tactile.
- Sans RTC à pile, le temps hors tension est inconnu : l'horloge reprend au dernier point sauvegardé (perte possible de la dernière minute). Les besoins ne se dégradent pas pendant l'arrêt. Les soins/achats sont sauvegardés immédiatement, l'état courant chaque minute.

## Reconstruire sous Windows (avancé, non exécuté ici)

Dans `sources`, installer Arduino CLI **1.3.1** officiel et Python 3.12, puis :

```bat
arduino-cli core update-index --additional-urls https://espressif.github.io/arduino-esp32/package_esp32_index.json
arduino-cli core install esp32:esp32@2.0.17 --additional-urls https://espressif.github.io/arduino-esp32/package_esp32_index.json
arduino-cli lib install TFT_eSPI@2.5.33
py -3 -m pip install -r firmware/requirements-build.txt
py -3 scripts/build_firmware.py
py -3 scripts/convert_firmware_assets.py
```

La définition écran est injectée par le script pour **tous** les fichiers C++ : ne pas éditer le `User_Setup.h` global de TFT_eSPI. Le build Linux de cette livraison est prouvé ; les scripts Windows et le flash USB doivent encore être vérifiés sur un poste Windows et le vrai matériel.
