/* =========================================================
   ASSISTANT & SIMULATEUR D'AIDES PAC 2026
   Référentiel des aides

   Source principale :
   "La nouvelle politique agricole commune – PAC 2023-2027"
   Version avril 2026 – Ministère de l'Agriculture

   IMPORTANT :
   Ce fichier contient les règles générales.
   Les montants annuels sont séparés dans parametres-2026.js.
========================================================= */

const AIDES_PAC = [

    /* =====================================================
       1. AIDE DE BASE AU REVENU / DPB
    ===================================================== */

    {
        id: "aide_base",
        nom: "Aide de base au revenu",
        abreviation: "DPB",
        categorie: "Paiements découplés",
        pilier: 1,

        description:
            "Paiement reposant sur l'activation de droits au paiement de base (DPB) sur des hectares admissibles.",

        conditionsPrincipales: [
            "Être agriculteur actif",
            "Détenir des DPB",
            "Activer les DPB sur des hectares admissibles"
        ],

        donneesNecessaires: [
            "agriculteurActif",
            "surfaceAdmissible",
            "nombreDPB",
            "valeurDPB"
        ],

        calculable: true,

        formule:
            "Somme de la valeur des DPB effectivement activés",

        pointsAVerifier: [
            "Nombre de DPB détenus",
            "Valeur individuelle ou moyenne des DPB de l'exploitation",
            "Nombre de DPB pouvant être activés",
            "Surface admissible disponible"
        ],

        source: {
            document: "PAC 2023-2027 – version avril 2026",
            fiche: "Aide de base au revenu",
            annexe: "Annexe 5 – Régime des droits au paiement de base"
        }
    },


    /* =====================================================
       2. ÉCORÉGIME
    ===================================================== */

    {
        id: "ecoregime",
        nom: "Écorégime",
        categorie: "Paiements découplés",
        pilier: 1,

        description:
            "Paiement annuel sur les hectares admissibles pour les exploitations répondant aux exigences d'une des voies d'accès à l'écorégime.",

        conditionsPrincipales: [
            "Être agriculteur actif",
            "Disposer de DPB",
            "Engager les surfaces admissibles de l'exploitation",
            "Respecter les exigences d'une voie d'accès"
        ],

        voies: [
            {
                id: "pratiques",
                nom: "Voie des pratiques"
            },
            {
                id: "certification",
                nom: "Voie de la certification"
            },
            {
                id: "biodiversite",
                nom: "Voie des éléments favorables à la biodiversité"
            }
        ],

        niveaux: [
            "base",
            "superieur",
            "agriculture_biologique"
        ],

        donneesNecessaires: [
            "agriculteurActif",
            "dpbActives",
            "surfaceAdmissible",
            "terresArables",
            "prairiesPermanentes",
            "culturesPermanentes",
            "certification",
            "surfaceIAE",
            "surfaceJacheres"
        ],

        bonusHaies: {
            disponible: true,

            conditionsPrincipales: [
                "Accéder à l'écorégime par une voie compatible",
                "Respecter le seuil de haies prévu",
                "Disposer d'une certification de gestion durable reconnue"
            ]
        },

        calculable: true,

        formule:
            "Surface admissible × montant unitaire correspondant au niveau obtenu",

        source: {
            document: "PAC 2023-2027 – version avril 2026",
            fiche: "Écorégime",
            annexe: "Annexe 6 – Écorégime : modalités"
        }
    },


    /* =====================================================
       3. AIDE REDISTRIBUTIVE
    ===================================================== */

    {
        id: "aide_redistributive",
        nom: "Aide redistributive complémentaire au revenu",
        categorie: "Paiements découplés",
        pilier: 1,

        description:
            "Paiement accordé sur les premiers hectares admissibles de l'exploitation.",

        conditionsPrincipales: [
            "Être agriculteur actif",
            "Activer au moins un DPB ou une fraction de DPB"
        ],

        plafondHectares: 52,

        transparenceGAEC: true,

        donneesNecessaires: [
            "agriculteurActif",
            "dpbActives",
            "surfaceAdmissible",
            "statutJuridique",
            "associesGAEC"
        ],

        calculable: true,

        formule:
            "min(surface admissible, 52 ha) × montant unitaire annuel, avec application éventuelle de la transparence GAEC",

        source: {
            document: "PAC 2023-2027 – version avril 2026",
            fiche: "Aide redistributive complémentaire au revenu"
        }
    },


    /* =====================================================
       4. AIDE COMPLÉMENTAIRE JEUNE AGRICULTEUR
    ===================================================== */

    {
        id: "acja",
        nom: "Aide complémentaire au revenu pour les jeunes agriculteurs",
        abreviation: "ACJA",
        categorie: "Paiements découplés",
        pilier: 1,

        description:
            "Montant forfaitaire destiné aux jeunes agriculteurs récemment installés.",

        conditionsPrincipales: [
            "Répondre à la définition de jeune agriculteur",
            "Être dans le cadre d'une première installation",
            "Installation l'année de la demande ou dans les cinq années civiles précédentes",
            "Activer au moins un DPB ou une fraction de DPB"
        ],

        ageMaximum: 40,

        dureeMaximumAnnees: 5,

        transparenceGAEC: true,

        donneesNecessaires: [
            "age",
            "agriculteurActif",
            "premiereInstallation",
            "anneeInstallation",
            "diplomeAgricole",
            "experienceAgricole",
            "dpbActives",
            "statutJuridique",
            "associesGAEC"
        ],

        calculable: true,

        formule:
            "Montant forfaitaire annuel par exploitation ou associé JA selon les règles applicables",

        source: {
            document: "PAC 2023-2027 – version avril 2026",
            fiche: "Aide complémentaire au revenu pour les jeunes agriculteurs"
        }
    },

   /* =====================================================
   5. AIDES COUPLÉES VÉGÉTALES
===================================================== */

{
    id: "legumineuses_graines",
    nom: "Aide aux légumineuses à graines et légumineuses fourragères destinées à la déshydratation ou aux semences",
    categorie: "Aides couplées végétales",
    pilier: 1,

    conditionsPrincipales: [
        "Être agriculteur actif",
        "Cultiver une production éligible"
    ],

    productionsEligibles: [
        "Protéagineux",
        "Soja",
        "Légumes secs",
        "Légumineuses fourragères destinées à la déshydratation",
        "Légumineuses fourragères destinées à la production de semences"
    ],

    particularites: [
        "Les mélanges céréales/protéagineux nécessitent plus de 50 % de protéagineux dans le mélange de semences implantées",
        "Les légumineuses destinées à la déshydratation doivent faire l'objet d'un contrat avec une entreprise de déshydratation"
    ],

    donneesNecessaires: [
        "agriculteurActif",
        "surfaceLegumineuses",
        "typeLegumineuses",
        "contratTransformation"
    ],

    calculable: true,

    formule:
        "Surface éligible × montant unitaire annuel",

    source: {
        document: "PAC 2023-2027 – version avril 2026",
        annexe: "Annexe 7 – Paiements couplés végétaux"
    }
},


{
    id: "legumineuses_fourrageres",
    nom: "Aide aux légumineuses fourragères",
    categorie: "Aides couplées végétales",
    pilier: 1,

    zones: [
        "Plaine et piémont",
        "Montagne et haute montagne"
    ],

    conditionsPrincipales: [
        "Être agriculteur actif",
        "Détenir au moins 5 UGB OU avoir un contrat direct avec un éleveur détenant au moins 5 UGB",
        "Cultiver des légumineuses fourragères éligibles"
    ],

    particularites: [
        "Les mélanges doivent contenir au moins 50 % de semences de légumineuses fourragères à l'implantation",
        "Les mélanges légumineuses/graminées sont éligibles uniquement l'année du semis"
    ],

    donneesNecessaires: [
        "agriculteurActif",
        "surfaceLegumineusesFourrageres",
        "zoneICHN",
        "ugb",
        "contratEleveur"
    ],

    calculable: true,

    formule:
        "Surface éligible × montant annuel correspondant à la zone",

    source: {
        document: "PAC 2023-2027 – version avril 2026",
        annexe: "Annexe 7 – Paiements couplés végétaux"
    }
},


{
    id: "ble_dur",
    nom: "Aide couplée à la production de blé dur",
    categorie: "Aides couplées végétales",
    pilier: 1,

    territoiresEligibles: [
        "Occitanie",
        "Provence-Alpes-Côte d’Azur",
        "Drôme",
        "Ardèche"
    ],

    conditionsPrincipales: [
        "Être agriculteur actif",
        "Cultiver du blé dur dans une zone éligible",
        "Disposer d'un contrat annuel de livraison avec un collecteur"
    ],

    donneesNecessaires: [
        "agriculteurActif",
        "surfaceBleDur",
        "localisation",
        "contratCollecteur"
    ],

    calculable: true,

    formule:
        "Surface éligible en blé dur × montant unitaire annuel",

    source: {
        document: "PAC 2023-2027 – version avril 2026",
        annexe: "Annexe 7 – Paiements couplés végétaux"
    }
},


{
    id: "pomme_terre_feculiere",
    nom: "Aide à la production de pommes de terre féculières",
    categorie: "Aides couplées végétales",
    pilier: 1,

    conditionsPrincipales: [
        "Être agriculteur actif",
        "Cultiver des pommes de terre féculières",
        "Disposer d'un contrat de culture avec une usine de première transformation ou une organisation de producteurs / coopérative"
    ],

    donneesNecessaires: [
        "agriculteurActif",
        "surfacePommesTerreFeculieres",
        "contratTransformation"
    ],

    calculable: true,

    formule:
        "Surface éligible × montant unitaire annuel",

    source: {
        document: "PAC 2023-2027 – version avril 2026",
        annexe: "Annexe 7 – Paiements couplés végétaux"
    }
},


{
    id: "riz",
    nom: "Aide couplée à la production de riz",
    categorie: "Aides couplées végétales",
    pilier: 1,

    conditionsPrincipales: [
        "Être agriculteur actif",
        "Disposer de surfaces implantées en riz"
    ],

    donneesNecessaires: [
        "agriculteurActif",
        "surfaceRiz"
    ],

    calculable: true,

    formule:
        "Surface éligible en riz × montant unitaire annuel",

    source: {
        document: "PAC 2023-2027 – version avril 2026",
        annexe: "Annexe 7 – Paiements couplés végétaux"
    }
},


{
    id: "houblon",
    nom: "Aide couplée à la production de houblon",
    categorie: "Aides couplées végétales",
    pilier: 1,

    conditionsPrincipales: [
        "Être agriculteur actif",
        "Disposer de surfaces implantées en houblon"
    ],

    donneesNecessaires: [
        "agriculteurActif",
        "surfaceHoublon"
    ],

    calculable: true,

    formule:
        "Surface éligible en houblon × montant unitaire annuel",

    source: {
        document: "PAC 2023-2027 – version avril 2026",
        annexe: "Annexe 7 – Paiements couplés végétaux"
    }
},


{
    id: "semences_graminees",
    nom: "Aide à la production de semences de graminées prairiales",
    categorie: "Aides couplées végétales",
    pilier: 1,

    conditionsPrincipales: [
        "Être agriculteur actif",
        "Produire des semences certifiées dans le cadre d'un contrat de culture",
        "Utiliser une variété autorisée"
    ],

    donneesNecessaires: [
        "agriculteurActif",
        "surfaceSemencesGraminees",
        "contratCulture",
        "varieteAutorisee"
    ],

    calculable: true,

    formule:
        "Surface éligible × montant unitaire annuel",

    source: {
        document: "PAC 2023-2027 – version avril 2026",
        annexe: "Annexe 7 – Paiements couplés végétaux"
    }
},


{
    id: "chanvre",
    nom: "Aide couplée à la production de chanvre",
    categorie: "Aides couplées végétales",
    pilier: 1,

    conditionsPrincipales: [
        "Être agriculteur actif",
        "Cultiver du chanvre éligible",
        "Disposer d'un contrat avec une entreprise de transformation ou de semences certifiées"
    ],

    donneesNecessaires: [
        "agriculteurActif",
        "surfaceChanvre",
        "contratChanvre"
    ],

    calculable: true,

    formule:
        "Surface éligible en chanvre × montant unitaire annuel",

    source: {
        document: "PAC 2023-2027 – version avril 2026",
        annexe: "Annexe 7 – Paiements couplés végétaux"
    }
},


{
    id: "petit_maraichage",
    nom: "Aide couplée au maraîchage",
    categorie: "Aides couplées végétales",
    pilier: 1,

    conditionsPrincipales: [
        "Être agriculteur actif",
        "Exploiter au moins 0,5 ha de légumes frais ou petits fruits rouges éligibles",
        "Avoir une SAU inférieure ou égale à 3 ha"
    ],

    surfaceMinimum: 0.5,
    sauMaximum: 3,

    donneesNecessaires: [
        "agriculteurActif",
        "sau",
        "surfaceMaraichage"
    ],

    calculable: true,

    formule:
        "Surface éligible en maraîchage × montant unitaire annuel",

    source: {
        document: "PAC 2023-2027 – version avril 2026",
        annexe: "Annexe 7 – Paiements couplés végétaux"
    }
},


{
    id: "fruits_transformes",
    nom: "Aides couplées aux productions destinées à la transformation",
    categorie: "Aides couplées végétales",
    pilier: 1,

    productionsEligibles: [
        "Prune d'Ente",
        "Cerise Bigarreau",
        "Poire Williams",
        "Pêche Pavie",
        "Tomate d'industrie"
    ],

    conditionsPrincipales: [
        "Être agriculteur actif",
        "Disposer d'un débouché industriel",
        "Être adhérent à une organisation de producteurs reconnue ou disposer d'un contrat avec une usine de transformation"
    ],

    donneesNecessaires: [
        "agriculteurActif",
        "typeProductionTransformee",
        "surfaceProductionTransformee",
        "contratTransformation"
    ],

    calculable: true,

    formule:
        "Surface contractualisée éligible × montant annuel correspondant à la production",

    source: {
        document: "PAC 2023-2027 – version avril 2026",
        annexe: "Annexe 7 – Paiements couplés végétaux"
    }
},


/* =====================================================
   6. AIDES COUPLÉES ANIMALES — HEXAGONE
===================================================== */

{
    id: "bovins_hexagone",
    nom: "Aide bovine",
    categorie: "Aides couplées animales",
    pilier: 1,
    territoire: "Hexagone",

    conditionsPrincipales: [
        "Être agriculteur actif",
        "Détenir au moins 5 UGB bovines",
        "Respecter les critères d'âge, de détention et d'identification des animaux"
    ],

    seuilMinimumUGB: 5,

    equivalencesUGB: {
        bovinPlus2Ans: 1,
        bovin6Mois2Ans: 0.6
    },

    plafonds: {
        ugbMaximum: 120,
        coefficientSurfaceFourragere: 1.4,
        protectionPremieresUGB: 40
    },

    niveaux: [
        "base",
        "superieur"
    ],

    donneesNecessaires: [
        "agriculteurActif",
        "bovins",
        "ugbEligibles",
        "ugbNiveauSuperieur",
        "ugbNiveauBase",
        "surfaceFourragere",
        "statutJuridique"
    ],

    calculable: true,
    niveauCalcul: "complexe",

    formule:
        "(UGB niveau supérieur × montant supérieur) + (UGB niveau de base × montant de base), après application des plafonds",

    source: {
        document: "PAC 2023-2027 – version avril 2026",
        annexe: "Annexe 8 – Paiements couplés animaux"
    }
},


{
    id: "veaux_qualite",
    nom: "Aide aux veaux sous la mère et aux veaux bio",
    categorie: "Aides couplées animales",
    pilier: 1,

    conditionsPrincipales: [
        "Être agriculteur actif",
        "Avoir élevé des veaux éligibles l'année civile précédant la demande",
        "Respecter un cahier des charges Label rouge, IGP éligible ou agriculture biologique",
        "Respecter les critères de détention et d'identification"
    ],

    detentionMinimumJours: 45,

    donneesNecessaires: [
        "agriculteurActif",
        "nombreVeauxEligibles",
        "certificationVeaux"
    ],

    calculable: true,

    formule:
        "Nombre de veaux éligibles × montant annuel par veau",

    source: {
        document: "PAC 2023-2027 – version avril 2026",
        annexe: "Annexe 8 – Paiements couplés animaux"
    }
},


{
    id: "ovins_hexagone",
    nom: "Aide ovine",
    categorie: "Aides couplées animales",
    pilier: 1,
    territoire: "Hexagone",

    conditionsPrincipales: [
        "Être agriculteur actif",
        "Déclarer au minimum 50 brebis éligibles",
        "Localiser les animaux en permanence",
        "Respecter les règles d'identification et de détention"
    ],

    seuilMinimumBrebis: 50,
    detentionMinimumJours: 100,

    ratioProductivite: 0.5,

    majoration: {
        premieresBrebis: 500,
        transparenceGAEC: true
    },

    aideNouveauProducteur: {
        disponible: true,
        dureeMaximumAnnees: 3
    },

    donneesNecessaires: [
        "agriculteurActif",
        "nombreBrebis",
        "agneauxVendus",
        "nouveauProducteurOvin",
        "anneeCreationAtelierOvin"
    ],

    calculable: true,

    formule:
        "Nombre de brebis primables × montant annuel, avec majorations et éventuelle aide nouveau producteur",

    source: {
        document: "PAC 2023-2027 – version avril 2026",
        annexe: "Annexe 8 – Paiements couplés animaux"
    }
},


{
    id: "caprins_hexagone",
    nom: "Aide caprine",
    categorie: "Aides couplées animales",
    pilier: 1,
    territoire: "Hexagone",

    conditionsPrincipales: [
        "Être agriculteur actif",
        "Demander l'aide pour au moins 25 chèvres éligibles",
        "Localiser les animaux en permanence",
        "Respecter les règles d'identification et de détention"
    ],

    seuilMinimumChevres: 25,
    plafondChevres: 400,
    detentionMinimumJours: 100,

    transparenceGAEC: true,

    donneesNecessaires: [
        "agriculteurActif",
        "nombreChevres",
        "statutJuridique"
    ],

    calculable: true,

    formule:
        "Nombre de chèvres primables × montant annuel",

    source: {
        document: "PAC 2023-2027 – version avril 2026",
        annexe: "Annexe 8 – Paiements couplés animaux"
    }
}

];
