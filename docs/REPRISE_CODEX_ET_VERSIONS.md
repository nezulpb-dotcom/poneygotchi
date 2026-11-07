# Reprise du développement lorsque Codex cloud échoue

## État actuel du dépôt

- La branche `main` contient **PonyGotchi v0.8**, un simulateur HTML/CSS/JS modulaire.
- `preview-offline.html` permet une exécution PC sans serveur.
- Les 3 backgrounds existants et les 32 sprites de Rosy sont dans `assets/`.
- **PonyGotchi Studio 1.2**, dernière livraison au format ZIP dans la conversation, n'est **pas encore intégré** à ce dépôt. Ne pas prétendre qu'un audit de `main` couvre ses nouvelles fonctionnalités ou son firmware.
- La version Studio dispose d'un firmware expérimental CrowPanel, mais n'a pas de preuve de compilation Arduino complète ni d'essai physique.

## Si l'environnement cloud de Codex ne démarre pas

L'échec est lié au lancement de l'exécuteur, **pas nécessairement au code source**. Réessayer une nouvelle tâche dans Codex ou travailler localement avec un clone du dépôt dans un environnement fonctionnel (VS Code, Codex CLI, ou terminal). Il n'est pas nécessaire d'effacer le dépôt, de modifier les GPIO, ni de réinstaller le firmware.

## Vérifications reproductibles sur un poste de développement

```sh
npm test
python scripts/build_preview.py
```

Pour le test du navigateur, installer Playwright pour Python et son navigateur :

```sh
python -m pip install playwright
python -m playwright install chromium
python tests/browser-smoke.py
```

La CI GitHub Actions exécute ces vérifications automatiquement à chaque push ou PR. Le programme Arduino sera compilé **séparément**, avec une toolchain ESP32 explicite, après intégration sécurisée de la version Studio.

## Règles d'intégration Studio

1. Importer les **sources** HTML/JS et C++ d'une version identifiée, sans écraser silencieusement la v0.8 qui fonctionne.
2. Ne pas committer des assets Cozy UI tiers dans le dépôt public sans licence de redistribution confirmée.
3. Préserver exactement les trois backgrounds validés, et garder le lockscreen sans HUD permanent.
4. Ajouter une compilation ESP32 reproductible ; conserver une copie de la bêta matérielle qui fonctionne jusqu'à validation de la nouvelle version.
5. Documenter séparément : tests de logique, tests de rendu PC, compilation Arduino, vérification sur l'appareil.

Les caractéristiques et broches du matériel sont détaillées dans `docs/CROWPANEL_DIS05035H_V22.md`.
