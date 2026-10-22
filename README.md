# Assistant PAC — V2 diagnostic automatique

Cette version transforme le simulateur en assistant de diagnostic : l'utilisateur décrit son exploitation et le moteur calcule lui-même les indicateurs nécessaires quand le guide national le permet.

## Principaux changements

- identité visuelle sans année fixe : **Assistant PAC** ;
- année de campagne demandée uniquement comme donnée du dossier pour les règles qui en ont besoin (ex. ACJA) ;
- calcul automatique du caractère d'agriculteur actif à partir des réponses détaillées ;
- calcul automatique du score de diversification de l'écorégime ;
- comparaison automatique des voies pratiques, certification et biodiversité ;
- calcul automatique des ratios PP, cultures permanentes, IAE et haies ;
- calcul automatique des UGB bovines à partir des effectifs saisis ;
- qualification JA calculée à partir de l'âge, de l'année d'installation, du diplôme et de l'expérience ;
- ICHN, CAB, MAEC, MRC, prédation, programmes sectoriels et aides régionales conservés dans le moteur ;
- montants annuels datés clairement comme références 2024/2025 lorsqu'ils ne constituent pas un taux courant.

## Référentiel

Source unique de travail : **La nouvelle politique agricole commune – PAC 2023-2027**, version avril 2026, Ministère de l'Agriculture.

Les dispositifs locaux ou incomplets dans ce guide ne sont pas inventés. Le moteur affiche alors une orientation ou un calcul partiel.

## Structure

```text
assistant-pac-v2/
├── index.html
├── style.css
├── script.js
├── README.md
├── data/
│   └── referentiel.js
└── modules/
    ├── profil.js
    ├── indicateurs.js
    ├── eligibility.js
    ├── calcul.js
    └── questionnaire.js
```

## Installation GitHub Pages

Remplacer ensemble les fichiers de l'ancien projet par ceux de cette version. Ne pas mélanger les anciens fichiers `profil.js`, `eligibility.js`, etc. avec les nouveaux : le modèle de données a changé.

L'ordre des scripts est déjà défini dans `index.html`.
