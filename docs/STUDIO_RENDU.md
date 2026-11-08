# Rendu Studio et CrowPanel

La [preview HTML](../studio/preview.html) fonctionne hors ligne. Le dossier
[after](studio-render/after) contient les captures 320 × 480 de l'accueil
aux trois heures, du HUD, du menu et des cinq soins.

Le HUD précédent commençait à y = 348. Son panneau couvrait le bas des
décors de soins, jusqu'à y = 434 pour le bain, et descendait en dehors du
canevas pendant son ouverture. Le menu plein écran était dessiné après
Rosy. Le même masquage se produisait avec les commandes du CrowPanel.
Dans Studio, les décors et sprites partagent un canevas. L'ordre de dessin
détermine les recouvrements. L'arrondi CSS de la vitre affecte le bord
extérieur de l'écran.

Les commandes occupent maintenant le bas de l'écran, avec quatre cibles
de 73 × 47 px dont les barres font partie. Les pourcentages sont lisibles
sous l'horloge. Le menu conserve Rosy visible et animée. Les trois PNG de
fond canoniques sont inchangés.

Sur le CrowPanel, les couches des soins sont mélangées en RGBA pour chaque
ambiance avant la conversion RGB565. Les RAW utilisent l'ordre natif de
l'ESP32, identique à celui des sprites. En PSRAM, les transitions dessinent
la bande de Rosy déjà composée et les animations suivantes n'envoient que
le rectangle couvrant son ancienne et sa nouvelle position.

## Vérifications sur PC

- Les 11 tests unitaires Node passent.
- Les deux parcours Chrome passent, dont les zones tactiles du HUD, les
  menus et la persistance de Studio.
- Le contrôle visuel vérifie le décodage des images, les trois ambiances
  automatiques et le retour de la sieste. Les captures sont prises depuis
  le canevas, à sa résolution native.
- Le firmware a été compilé avec Arduino CLI, ESP32 Arduino 2.0.17,
  TFT_eSPI et PSRAM activée. La procédure se trouve dans
  [Installation Windows](../CrowPanel/INSTALLATION_WINDOWS.txt).

L'aperçu physique des couleurs, la calibration du tactile, le débit de la
microSD et l'absence de scintillement restent à contrôler sur le CrowPanel.

Les captures du dossier [before](studio-render/before) reproduisent
l'ancien ordre de dessin et l'ancien HUD à partir des blocs de rendu relevés
avant la correction. Le premier lancement de Chrome n'a pas pu produire
les captures dans l'environnement restreint.
