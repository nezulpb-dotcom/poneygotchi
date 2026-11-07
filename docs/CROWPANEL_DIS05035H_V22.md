# Cible matérielle confirmée pour PonyGotchi

Ces paramètres concernent **l'appareil effectivement utilisé** pour les essais de PonyGotchi. Ils ne sont pas universels pour toutes les révisions CrowPanel.

- Carte : **Elecrow CrowPanel ESP32 3,5 pouces**, SKU `DIS05035H`, PCB **V2.2**.
- Microcontrôleur : **ESP32-WROVER-B**.
- Écran : **ILI9488**, 480×320 natif, affiché en **portrait 320×480**.
- Entrée : écran **tactile résistif**.
- IDE : Arduino IDE 2.x, sélection **ESP32 Dev Module**, bibliothèque `TFT_eSPI`.
- Stockage : carte microSD sur le port TF du CrowPanel.

## Réglage TFT_eSPI utilisé lors des essais

Les valeurs ci-dessous ont été utilisées pour afficher la scène test avec succès sur cet appareil :

```cpp
#define ILI9488_DRIVER
#define TFT_WIDTH 320
#define TFT_HEIGHT 480
#define TFT_MISO 33
#define TFT_MOSI 13
#define TFT_SCLK 14
#define TFT_CS 15
#define TFT_DC 2
#define TFT_RST -1
#define TFT_BL 27
#define TFT_BACKLIGHT_ON HIGH
#define TOUCH_CS 12
#define LOAD_GLCD
#define LOAD_FONT2
#define LOAD_FONT4
#define LOAD_GFXFF
#define SPI_FREQUENCY 27000000
#define SPI_READ_FREQUENCY 16000000
#define SPI_TOUCH_FREQUENCY 2500000
```

Le rendu RAW RGB565 correct a nécessité `tft.setSwapBytes(true)` avant `tft.pushImage(...)` pendant les premiers essais.

## Bus microSD validé en lecture/écriture

```cpp
SPIClass sdSPI(HSPI);
sdSPI.begin(18, 19, 23, 5);  // SCK, MISO, MOSI, CS
SD.begin(5, sdSPI, 4000000);
```

Le transfert USB vers la microSD a déjà été réalisé via Python + `pyserial` en fermant préalablement le Serial Monitor. Attention : la procédure exacte dépend du **firmware de réception série** qui est chargé sur la carte ; ne pas présumer qu'un firmware de jeu accepte lui-même ce protocole.

## Contraintes de la prochaine version

1. Garder l'horloge **manuelle**, sans imposer le Wi-Fi. En l'absence de RTC à pile, une coupure complète d'alimentation empêche de connaître le temps écoulé hors tension.
2. Préserver la fluidité du rendu et éviter l'effacement complet de l'écran à chaque frame.
3. Distinguer les **tests PC**, la **compilation réelle avec la toolchain Arduino ESP32** et la **validation physique sur CrowPanel**. Aucun test navigateur ne prouve un fonctionnement matériel.
4. Conserver les trois paysages validés par l'utilisateur et séparer les sprites/menus des arrière-plans.
5. Vérifier les licences des packs Cozy UI avant publication des assets dans un dépôt public.

## Statut de validation

Ces broches et le rendu écran / carte SD proviennent des essais utilisateur sur V2.2 ; cela **ne vaut pas validation** du firmware PonyGotchi Studio 1.2. Un essai d'affichage ne valide pas automatiquement la précision du tactile ni l'ensemble des animations.
