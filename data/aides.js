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
    }

];
