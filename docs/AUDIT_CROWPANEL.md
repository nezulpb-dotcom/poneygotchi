# Audit technique et décisions — 0.10.0

## Périmètre vérifié

Audit du 7 novembre 2026 : sources JS/CSS/HTML, tests, scripts de génération, assets, documentation et CI du dépôt `nezulpb-dotcom/poneygotchi`. Les refs distantes ont été interrogées : `main` (598d1b3), `feat/ponygotchi-v09-living-meadow` (6b23e8a), `improvement/ci-crowpanel-recovery` (6218a08). La branche de travail `feat/crowpanel-foundation` part de cette dernière afin de conserver ses consignes V2.2 et sa CI. Elle inclut les améliorations v0.9 fusionnées dans main.

**Limite : aucun ZIP Studio 1.2 ni source Studio n'est présent dans ces refs ou dans les fichiers accessibles.** La documentation de reprise confirme une livraison externe. Cette version est une fondation nouvelle, pas une intégration supposée de Studio. Ne pas renommer le nouveau firmware « Studio 1.2 ». Son intégration reste bloquée par l'absence des sources et de leur licence.

## Défauts et traitement par étapes

| Constat initial | Traitement 0.10.0 | Limite restante |
| --- | --- | --- |
| Aucun programme Arduino ni preuve de build | Sketch réel, moteur portable, CLI/core/bibliothèque figés, build Linux effectif | Windows et vrai appareil non testés |
| Broches initialement inconnues | Reprise du profil V2.2 documenté par les essais utilisateur sur la branche recovery | Non transposable aux autres PCB |
| PNG et DOM inutilisables directement sur ESP32 | Conversion déterministe RGB565, PSRAM et TFT_eSPI séparés du moteur | Palette/couleurs physiques à vérifier |
| Risque de scintillement par effacement global | Fond RAM restauré sous les sprites, tuile de composition 320×32, viewport limité à l'union ancien/nouveau sprite | FPS réel, déchirement et durée SPI non mesurés |
| Lecture SD à chaque frame potentiellement lente | Préchargement des 32 sprites en PSRAM, seulement les changements de décor relisent le fond | Chargement initial et qualité de la SD à mesurer |
| Absence d'horloge manuelle | Horloge persistante sans Wi-Fi, réglage tactile/série ; équivalent affichage réglable dans la preview | Pas de RTC : durée hors tension inconnue |
| Pas de sauvegarde ESP32 | État versionné et validé dans Preferences/NVS ; soins immédiats, périodique chaque minute | Coupure durant une action non essayée ; cooldowns de récompense des soins redémarrent au reboot |
| Aucune exploration | Trois découvertes uniques avec niveaux requis, sans remplacer les backgrounds | Il ne s'agit pas encore de lieux navigables ou d'une carte |
| Restauration JS insuffisamment validée | Rejet des valeurs infinies/cooldowns invalides, bornes numériques, migration et nouvelles données normalisées | Export/import utilisateur à développer |
| Smoke test dépendant de l'heure réelle | Assertion de format, test déterministe de l'heure réglée | Les captures PC n'attestent pas le rendu TFT |
| Aucune livraison matérielle exploitable | Paquet firmware fusionné + SD + preview + sources + SHA256 + installation/restauration Windows | Scripts Windows fournis mais non exécutés sous Windows |

## Choix de rendu et budget

- Carte retenue : DIS05035H V2.2, WROVER-B, ILI9488, portrait 320×480, SPI écran 27 MHz et SD 4 MHz ; profil conforme au document matériel existant. Tactile calibré sur la carte, jamais de valeurs de calibration inventées.
- Arduino CLI 1.3.1, Arduino ESP32 2.0.17, TFT_eSPI 2.5.33 (commit `317ce97e598c004d158b87d01940a31acfb3eced`). Le core 2.x limite ici le risque de compatibilité avec ce TFT ; ce choix est une base compilée, pas une validation de toutes les versions plus récentes.
- Configuration TFT forcée à la compilation de tous les C++ : pas de modification globale de bibliothèque.
- PSRAM : fond 307 200 octets + sprites 1 327 104 octets, soit **1 634 304 octets**, hors overhead. Tuile interne 20 480 octets. Les allocations sont contrôlées ; pas de fonctionnement silencieux sans PSRAM.
- Pas de `fillScreen` dans la boucle périodique. Chaque frame modifiée restaure le fond puis compose les PNG convertis et l'UI dans une tuile ; seul le rectangle invalidé est transféré. Le plein écran n'est redessiné qu'à l'initialisation, à un changement de scène ou une transition UI/calibration/horloge.
- Intervalle nominal 66 ms (~15 FPS) ; poses toutes les 180 ms (650 ms sommeil). **Aucune mesure de FPS matériel.** Les scènes sont des PNG indépendants inchangés, pas des maquettes complètes.
- RAW little-endian RGB565, 0xF81F réservé à la transparence. Les buffers TFT_eSprite sont en ordre d'octets écran ; la conversion est explicite. Cela est testé côté conversion, pas par observation du TFT.
- UI originale, palette pastel et contrôles en pixels ; aucun pack tiers « Cozy UI » sans licence n'est importé. Le raffinement graphique complet reste un jalon artistique distinct.

## État fonctionnel et écarts assumés

Le navigateur conserve les fonctionnalités historiques, plus l'horloge d'affichage et trois découvertes. Le firmware propose les quatre soins, autonomie, XP/niveaux/étoiles, trois options d'équipement, quêtes repas/eau/mouvement/pause facultatives, découvertes et horloge. Ce port n'est pas encore en parité : pas de rappels d'eau firmware, pas de particules d'ambiance ni accessoires illustrés complets ; l'accessoire firmware est un marqueur de couleur. Les deux moteurs sont distincts et ont leurs tests propres, pas une simulation unique partagée.

Ne jamais interpréter une compilation réussie comme preuve de fluidité, précision tactile, absence de scintillement, sauvegarde résistante aux coupures ou stabilité d'alimentation sur CrowPanel. Le premier essai physique doit vérifier alimentation/PSRAM, calibration portrait, couleurs des trois fonds, chacune des huit poses, les quatre soins, limites de récompense, changement d'heure, sauvegarde après reboot et vitesse de rendu. Conserver le firmware précédent avant de flasher.

## Étapes suivantes

1. Importer et auditer Studio à réception du ZIP source, en comparant ses règles et assets avec cette base, sans écrasement silencieux.
2. Exécuter le protocole matériel V2.2 et relever les mesures SPI/FPS, RAM et calibration ; ajuster seulement d'après ces résultats.
3. Persister les cooldowns entre redémarrages sans pénaliser le temps hors tension ; approfondir l'exploration et les accessoires pixel art.
4. Harmoniser progressivement les contrats de sauvegarde et le comportement des moteurs navigateur/ESP32.
