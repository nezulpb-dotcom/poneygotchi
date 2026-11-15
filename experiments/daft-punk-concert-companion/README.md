# Daft Punk — Daily Life & Music Lab

Bêta navigateur 0.5 du compagnon musical pour le CrowPanel DIS05035H V2.2.

## Nouveautés de la bêta 0.5

- **Synthèse sonore originale** via Web Audio : kicks, claps, hats et notes de synthé générés dans le navigateur, sans échantillon musical protégé. Le son peut être coupé à tout moment.
- **Mini-jeux audibles** : les pads du Beat Sequencer et de la Mix Console jouent leur son ; Synth Memory propose un bouton d'écoute avant la reproduction.
- **Ouverture de concert** : rideau lumineux animé, faisceaux graphiques et séquence sonore originale en trois temps.
- **Commandes tactiles** : zones d'appui agrandies sur les écrans tactiles, focus clavier visible et respect de la préférence système de réduction des animations.
- **Progression et sauvegardes** : le moteur bêta 0.4 reste inchangé, avec migration des anciennes sauvegardes, jauges persistantes et renouvellement quotidien des missions/mini-jeux.

## Nouveautés de la bêta 0.3

- **Missions IRL** : hydratation, repas varié, mouvement doux, pause sans écran, capture d'une idée et rangement d'un petit espace. Elles sont validées manuellement, sans preuve ni pénalité.
- **Beat Sequencer** : reproduire une boucle de quatre frappes (kick, clap, kick, hat).
- **Synth Memory** : reproduire une séquence de trois sons dans le bon ordre.
- **Mix Console** : équilibrer basse, lead et beat.
- **Sauvegarde locale** via un moteur JavaScript indépendant (`game.js`) et localStorage ; les données sont normalisées et les jauges sont bornées entre 0 et 100.
- **Renouvellement quotidien** : les missions cochées et victoires des mini-jeux sont réinitialisées au changement de date locale ; les jauges déjà gagnées sont conservées.\n- **Migration de sauvegarde** : les progressions du prototype bêta 0.3 sont reprises automatiquement dans le nouveau moteur.
- **Concert** : déverrouillage lorsque Moral, Musique et Inspiration atteignent chacun 100 % ; le nombre de concerts lancés est conservé.

## Tester

Ouvrir `index.html` dans un navigateur récent via un serveur local (les modules JavaScript ES nécessitent un contexte HTTP). La progression est enregistrée sur le navigateur utilisé. Le bouton « Réinitialiser la démo » efface cette progression après confirmation. Les huit tests du moteur sont dans `tests/daft-punk-companion.test.mjs` et s'exécutent avec `node --test tests/daft-punk-companion.test.mjs` ou via `npm test` à la racine.

## Règles de jeu

Les actions de vie réelle sont des suggestions de bien-être ordinaires, jamais des prescriptions. Le joueur les valide librement. Aucune preuve, donnée de santé ou information personnelle n'est collectée. Les missions manquées ne retirent aucun point. Le prototype ne récompense pas la restriction alimentaire, l'exercice excessif ou la consommation forcée d'eau.

## Direction artistique et droits — Alexis Bee

Alexis Bee a confirmé par courriel (15 novembre 2026) que les fichiers de son site peuvent être utilisés pour ce projet, sous trois conditions : aucun usage commercial, ne pas rendre ses fichiers librement accessibles sur GitHub et afficher un crédit ou watermark visible dans le projet. Le compagnon affiche désormais « Pixel art : Alexis Bee ».

Les ressources sont volontairement séparées du dépôt public : copier `assets.local.example.js` vers `assets.local.js`, puis placer les fichiers autorisés dans `private-assets/`. Ces deux chemins sont ignorés par Git. Les robots provisoires restent affichés si la configuration locale est absente. Voir [PRIVATE_ASSETS.md](./PRIVATE_ASSETS.md) pour les consignes.

Référence artiste : https://internetbee.neocities.org/archive/2024/featured_051224. Aucun morceau Daft Punk ni extrait commercial n'est embarqué. La vidéo est référencée dans la configuration locale mais son lecteur n'est pas encore intégré ; ne pas la publier sur le web sans clarification sur l'accès aux fichiers.

## Limites actuelles

- La progression est sauvegardée dans le navigateur, pas synchronisée entre appareils. Les jauges survivent au changement de date ; les missions et récompenses de mini-jeux sont renouvelées chaque jour.
- Les jauges sont persistantes et ne diminuent pas ; le changement de date renouvelle les missions et mini-jeux.
- Le changement de date utilise la date locale du navigateur.
- Les sons des mini-jeux sont générés en temps réel par Web Audio.
- Aucun portage firmware, build ESP32, test matériel ou flash CrowPanel n'a été effectué.
- La preview ne constitue pas encore un lecteur vidéo embarqué.

## Prochaines étapes

1. Associer les vrais GIF privés aux emplacements argenté/doré et au décor dans `assets.local.js`.
2. Intégrer une cinématique locale du concert après validation de son périmètre d'utilisation et mesurer ses contraintes de lecture.
3. Concevoir un catalogue de missions quotidiennes variables.
4. Porter le moteur et l'interface vers l'ESP32 / ILI9488 en préservant les ressources et sauvegardes de PonyGotchi.
