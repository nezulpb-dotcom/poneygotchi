# Ressources graphiques privées — Alexis Bee

Les ressources ont été retrouvées dans le dépôt privé `nezulpb-dotcom/daft-punk-private-assets`. La racine contient 24 fichiers (dont 23 ressources GIF et le README), pour environ 2,53 Mo. Les variantes comprennent des personnages animés, des décors et un visuel de concert.

## Démarrer la bêta en local

Depuis la racine du dépôt public, récupère le dépôt privé auquel tu as accès, puis copie ses GIF dans le dossier local du compagnon :

```sh
git clone https://github.com/nezulpb-dotcom/daft-punk-private-assets.git /tmp/daft-punk-private-assets
mkdir -p experiments/daft-punk-concert-companion/private-assets
cp /tmp/daft-punk-private-assets/*.gif experiments/daft-punk-concert-companion/private-assets/
cp experiments/daft-punk-concert-companion/assets.local.example.js experiments/daft-punk-concert-companion/assets.local.js
cd experiments/daft-punk-concert-companion
npm test
python3 -m http.server 8000
```

Ouvre ensuite `http://localhost:8000` dans ton navigateur. Le dossier `private-assets/` et `assets.local.js` sont ignorés par Git. Les tests automatisés vérifient les quêtes, les récompenses, la progression jusqu'au concert et la conservation des thèmes.

## Intégration locale

- Ne jamais ajouter les GIF, images, vidéos ou autres fichiers originaux au dépôt public.
- Conserver les fichiers dans `private-assets/` sur la machine de développement uniquement. Ce dossier est ignoré par Git.
- Copier `assets.local.example.js` vers `assets.local.js`, puis adapter les chemins si les fichiers sont rangés autrement. `assets.local.js` est également ignoré par Git.
- Le code public charge les ressources locales seulement si ce fichier de configuration existe. Sans lui, la démo conserve ses personnages provisoires.
- Le crédit « Pixel art : Alexis Bee » reste visible dans la scène. Ne pas le masquer.

## Fichiers sélectionnés pour le premier écran

- `Daft-Punk_Alive-2007_2x.gif` : sprite animé réunissant les deux personnages, utilisé comme personnage principal de la scène.
- `Daft-Punk_Alive-2007_bg.gif` : décor de scène Alive 2007.
- `Daftendirektour_Rollin-And-Scratchin_visual.gif` : visuel animé optionnel affiché pendant l'écran du concert.

Les fichiers `Daft-Punk_RAM_2x.gif`, `Daft-Punk_RAM_bg.gif`, `Daft-Punk_TRON_2x.gif` et `Daft-Punk_TRON_bg.gif` sont repérés comme variantes possibles pour de futurs thèmes.

## Limite de distribution

Une page web publique qui charge directement ces images ou cette vidéo rendrait les fichiers récupérables par les visiteurs, même si le dépôt GitHub des assets reste privé. Cette intégration est donc prévue pour un lancement local avec les fichiers privés présents sur la machine, et non pour publier les ressources sous licence dans un déploiement public.

## Vidéo et attribution

Le GIF de visuel de concert est distinct de la vidéo MP4 initialement évoquée. Le lecteur MP4 n'est pas encore intégré ; son usage comme cinématique d'ouverture n'est pas présumé autorisé par les informations disponibles.

Crédit visible dans le compagnon : **Pixel art : Alexis Bee**. Conserver également un lien vers https://internetbee.neocities.org/archive/2024/featured_051224 dans les crédits et la documentation du projet.

## Thèmes visuels déblocables

- **ALIVE 2007** est disponible dès le départ.
- **RAM** se débloque après un premier concert terminé.
- **TRON** se débloque après trois concerts terminés.
- La progression de concert est conservée d'un jour à l'autre ; les quêtes et mini-jeux quotidiens sont renouvelés.
- Le choix du thème est sauvegardé localement et conservé lors du renouvellement quotidien des missions.
- Les quatre fichiers GIF RAM/TRON sont chargés depuis `private-assets/` via `assets.local.js`, jamais depuis le dépôt public.
