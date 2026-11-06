# Portage futur — CrowPanel ESP32 3.5 pouces

Matériel décrit par l'utilisateur : Elecrow CrowPanel ESP32, écran tactile résistif 3.5" TFT 480×320 piloté par ILI9488, slot microSD / TF intégré, ESP32 familial WROVER-B cité dans la fiche (en conflit avec la mention WROOM-32 d'introduction).

Cible UI : **portrait 320×480** après rotation, et adaptation correcte du tactile.

Points à vérifier avant tout portage :

1. Révision exacte inscrite sur la PCB (V1.x, V2.0, V2.2 ou autre).
2. GPIO et bus SPI de l'écran / carte SD et broche CS du tactile.
3. Calibration tactile pour la rotation portrait.
4. Disponibilité RAM / PSRAM et débit pour les assets 144×144 et fonds 320×480.
5. Contrôle du rétroéclairage, alimentation, haut-parleur, RTC éventuelle.
6. Système de fichiers carte microSD et format des assets (RGB565 / BMP / PNG avec décodage approprié).

Proposer ensuite un moteur de jeu partagé au niveau des structures, du comportement et des règles, avec affichage séparé HTML PC vs C++ ESP32. **Ce dossier ne contient pas encore de firmware validé sur l'appareil.**
