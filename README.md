# Assistant PAC 2026 — version compatible

Cette version regroupe des fichiers conçus pour fonctionner ensemble.

## Fichiers JavaScript à remplacer ensemble

- `data/aides.js`
- `data/parametres-2026.js`
- `modules/profil.js`
- `modules/eligibility.js`
- `modules/calcul.js`
- `modules/questionnaire.js`

Le fichier `script.js` est également inclus.

## Interface

`index.html` et `style.css` correspondent à l'interface « TelePAC modernisé » avec navigation latérale.

## Important

Ne mélangez pas ces fichiers avec une ancienne version du projet : les chemins de données du profil et les fonctions appelées par le questionnaire doivent rester synchronisés.
