# Assets et droits

## Sources présentes

- `references/01_lockscreen_user.png` et `02_compact_ui_user.png` : **images fournies par l'utilisateur**, pour inspiration visuelle seulement. La licence de ces œuvres externes n'est pas confirmée ; **ne pas les réutiliser comme assets commerciaux ni les redistribuer en dehors du contexte du projet sans vérifier les droits**.
- `backgrounds/background_source.png` : illustration **générée pour ce projet**, sans texte ni UI baked-in ; les variantes 320×480 sont créées depuis elle.
- `backgrounds/meadow_day.png`, `meadow_dusk.png`, `meadow_night.png` : variants adaptées pour le simulateur et la future conversion ESP32.
- `ponies/rosy/*.png` : **32 images originales** créées par `scripts/generate_sprites.py`, transparentes et indépendantes du décor (8 états × 4 frames) ; pas de personnage officiel My Little Pony.

## Remplacer / améliorer

Rosy a 8 états : idle, walk, blink, happy, eat, sleep, sad, wash. Le code attend `état_00.png` à `état_03.png`. Dimensions 144×144, pixels nets, PNG RGBA transparents, pieds sur une ligne cohérente. Ne jamais dessiner l'heure, l'UI ou Rosy dans le fichier de fond.

Pour le fond, dessiner à 320×480 ou plus haut puis réduire en gardant l'aspect pixel-art. Préserver une zone aérée au-dessus de la tête de Rosy afin de laisser l'horloge lisible.
