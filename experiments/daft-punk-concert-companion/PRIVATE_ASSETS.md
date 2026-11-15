# Ressources graphiques privées — Alexis Bee

Les conditions confirmées par courriel autorisent l'utilisation des fichiers du site pour ce projet, sans usage commercial, à condition qu'ils ne soient pas rendus librement accessibles sur GitHub et qu'Alexis Bee soit crédité visiblement dans le projet.

## Règles de dépôt

- Ne jamais ajouter les GIF, images, vidéos ou autres fichiers originaux au dépôt GitHub.
- Ne jamais publier de spritesheets dérivées, conversions, miniatures ou exports qui rendent les créations récupérables.
- Conserver les fichiers dans `private-assets/` sur la machine de développement uniquement. Ce dossier est ignoré par Git.
- Copier `assets.local.example.js` vers `assets.local.js`, puis adapter les chemins locaux. `assets.local.js` est également ignoré par Git.
- Le code public charge les ressources locales seulement si ce fichier de configuration existe. Sans lui, la démo conserve ses personnages provisoires.
- Le crédit « Pixel art : Alexis Bee » reste visible dans la scène. Ne pas le masquer.

## Limite de distribution

Une page web publique qui charge directement ces images ou cette vidéo rendrait les fichiers récupérables par les visiteurs, même si le dépôt GitHub reste privé pour les assets. Ne pas publier une démo web utilisant les ressources sous licence sans accord complémentaire explicite sur l'hébergement et l'accès aux fichiers.

## Vidéo

Le chemin `concertVideo` est préparé dans la configuration locale, mais la vidéo n'est pas encore intégrée au lecteur du concert. Son usage comme cinématique d'ouverture doit être validé séparément si le courriel ne couvre pas explicitement cette vidéo.

## Attribution

Crédit visible dans le compagnon : **Pixel art : Alexis Bee**. Conserver également un lien vers https://internetbee.neocities.org/archive/2024/featured_051224 dans les crédits et la documentation du projet.
