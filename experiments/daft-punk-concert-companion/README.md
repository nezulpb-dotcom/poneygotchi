# Daft Punk — Daily Life & Music Lab

Bêta navigateur 0.4 du compagnon musical pour le CrowPanel DIS05035H V2.2.

## Nouveautés de la bêta 0.3

- **Missions IRL** : hydratation, repas varié, mouvement doux, pause sans écran, capture d'une idée et rangement d'un petit espace. Elles sont validées manuellement, sans preuve ni pénalité.
- **Beat Sequencer** : reproduire une boucle de quatre frappes (kick, clap, kick, hat).
- **Synth Memory** : reproduire une séquence de trois sons dans le bon ordre.
- **Mix Console** : équilibrer basse, lead et beat.
- **Sauvegarde locale** via un moteur JavaScript indépendant (`game.js`) et localStorage ; les données sont normalisées et les jauges sont bornées entre 0 et 100.
- **Renouvellement quotidien** : les missions cochées et victoires des mini-jeux sont réinitialisées au changement de date locale ; les jauges déjà gagnées sont conservées.
- **Concert** : déverrouillage lorsque Moral, Musique et Inspiration atteignent chacun 100 % ; le nombre de concerts lancés est conservé.

## Tester

Ouvrir `index.html` dans un navigateur récent via un serveur local (les modules JavaScript ES nécessitent un contexte HTTP). La progression est enregistrée sur le navigateur utilisé. Le bouton « Réinitialiser la démo » efface cette progression après confirmation. Les tests du moteur sont dans `tests/daft-punk-companion.test.mjs` et s'exécutent avec `node --test tests/daft-punk-companion.test.mjs` ou via `npm test` à la racine.

## Règles de jeu

Les actions de vie réelle sont des suggestions de bien-être ordinaires, jamais des prescriptions. Le joueur les valide librement. Aucune preuve, donnée de santé ou information personnelle n'est collectée. Les missions manquées ne retirent aucun point. Le prototype ne récompense pas la restriction alimentaire, l'exercice excessif ou la consommation forcée d'eau.

## Direction artistique et droits

Les robots du prototype sont des formes CSS originales et ne sont pas des reproductions des sprites sous licence. Les assets Internet Bee sont référencés ici : https://internetbee.neocities.org/archive/2024/featured_051224. Leur intégration dans une distribution devra respecter la licence payante et les obligations d'attribution communiquées par le titulaire des droits. La vidéo d'ouverture du concert n'est pas encore intégrée. Aucun morceau Daft Punk ni extrait commercial n'est embarqué.

## Limites actuelles

- La progression est sauvegardée dans le navigateur, pas synchronisée entre appareils. Les jauges survivent au changement de date ; les missions et récompenses de mini-jeux sont renouvelées chaque jour.
- Les jauges sont persistantes et ne diminuent pas ; le changement de date renouvelle les missions et mini-jeux.
- Le changement de date utilise la date locale du navigateur.
- Les sons des mini-jeux sont visuels seulement à ce stade.
- Aucun portage firmware, build ESP32, test matériel ou flash CrowPanel n'a été effectué.
- La preview ne constitue pas encore un lecteur vidéo embarqué.

## Prochaines étapes

1. Ajouter des sons synthétiques originaux et une meilleure sensation rythmique.
2. Concevoir un catalogue de missions quotidiennes variables.
3. Préparer la séquence d'ouverture du concert avec le format média adapté au CrowPanel.
4. Porter le moteur et l'interface vers l'ESP32 / ILI9488 en préservant les ressources et sauvegardes de PonyGotchi.
