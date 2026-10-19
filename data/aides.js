/* =========================================================
   ASSISTANT & SIMULATEUR D'AIDES PAC 2026
   RÉFÉRENTIEL DES AIDES

   Source de référence :
   « La nouvelle politique agricole commune – PAC 2023-2027 »
   Version avril 2026 – Ministère de l'Agriculture.

   Les dispositifs pour lesquels le guide ne fournit pas de
   formule complète sont conservés comme aides d'orientation.
========================================================= */

const AIDES_PAC = [
    {
        id: "aide_base",
        nom: "Aide de base au revenu",
        abreviation: "DPB",
        categorie: "Paiements découplés",
        pilier: 1,
        calculable: true,
        source: "Fiche Aide de base au revenu – Annexe 5"
    },
    {
        id: "ecoregime",
        nom: "Écorégime",
        categorie: "Paiements découplés",
        pilier: 1,
        calculable: true,
        source: "Fiche Écorégime – Annexe 6"
    },
    {
        id: "aide_redistributive",
        nom: "Aide redistributive complémentaire au revenu",
        categorie: "Paiements découplés",
        pilier: 1,
        calculable: true,
        source: "Fiche Aide redistributive complémentaire au revenu"
    },
    {
        id: "acja",
        nom: "Aide complémentaire au revenu pour les jeunes agriculteurs",
        abreviation: "ACJA",
        categorie: "Paiements découplés",
        pilier: 1,
        calculable: true,
        source: "Fiche Aide complémentaire au revenu pour les jeunes agriculteurs"
    },

    /* AIDES COUPLÉES VÉGÉTALES */
    {
        id: "legumineuses_graines",
        nom: "Légumineuses à graines, déshydratation et semences",
        categorie: "Aides couplées végétales",
        pilier: 1,
        calculable: true,
        source: "Annexe 7 – Paiements couplés végétaux"
    },
    {
        id: "legumineuses_fourrageres",
        nom: "Légumineuses fourragères",
        categorie: "Aides couplées végétales",
        pilier: 1,
        calculable: true,
        source: "Annexe 7 – Paiements couplés végétaux"
    },
    {
        id: "ble_dur",
        nom: "Aide couplée au blé dur",
        categorie: "Aides couplées végétales",
        pilier: 1,
        calculable: true,
        source: "Annexe 7 – Paiements couplés végétaux"
    },
    {
        id: "pomme_terre_feculiere",
        nom: "Aide à la pomme de terre féculière",
        categorie: "Aides couplées végétales",
        pilier: 1,
        calculable: true,
        source: "Annexe 7 – Paiements couplés végétaux"
    },
    {
        id: "riz",
        nom: "Aide couplée au riz",
        categorie: "Aides couplées végétales",
        pilier: 1,
        calculable: true,
        source: "Annexe 7 – Paiements couplés végétaux"
    },
    {
        id: "houblon",
        nom: "Aide couplée au houblon",
        categorie: "Aides couplées végétales",
        pilier: 1,
        calculable: true,
        source: "Annexe 7 – Paiements couplés végétaux"
    },
    {
        id: "semences_graminees",
        nom: "Aide aux semences de graminées prairiales",
        categorie: "Aides couplées végétales",
        pilier: 1,
        calculable: true,
        source: "Annexe 7 – Paiements couplés végétaux"
    },
    {
        id: "chanvre",
        nom: "Aide couplée au chanvre",
        categorie: "Aides couplées végétales",
        pilier: 1,
        calculable: true,
        source: "Annexe 7 – Paiements couplés végétaux"
    },
    {
        id: "petit_maraichage",
        nom: "Aide couplée au petit maraîchage",
        categorie: "Aides couplées végétales",
        pilier: 1,
        calculable: true,
        source: "Annexe 7 – Paiements couplés végétaux"
    },
    {
        id: "fruits_transformes",
        nom: "Aides aux productions destinées à la transformation",
        categorie: "Aides couplées végétales",
        pilier: 1,
        calculable: true,
        source: "Annexe 7 – Paiements couplés végétaux"
    },

    /* AIDES COUPLÉES ANIMALES */
    {
        id: "bovins_hexagone",
        nom: "Aide bovine – Hexagone",
        categorie: "Aides couplées animales",
        pilier: 1,
        calculable: true,
        source: "Annexe 8 – Paiements couplés animaux"
    },
    {
        id: "veaux_qualite",
        nom: "Aide aux veaux sous la mère et aux veaux bio",
        categorie: "Aides couplées animales",
        pilier: 1,
        calculable: true,
        source: "Annexe 8 – Paiements couplés animaux"
    },
    {
        id: "ovins_hexagone",
        nom: "Aide ovine – Hexagone",
        categorie: "Aides couplées animales",
        pilier: 1,
        calculable: true,
        source: "Annexe 8 – Paiements couplés animaux"
    },
    {
        id: "caprins_hexagone",
        nom: "Aide caprine – Hexagone",
        categorie: "Aides couplées animales",
        pilier: 1,
        calculable: true,
        source: "Annexe 8 – Paiements couplés animaux"
    },
    {
        id: "bovins_corse",
        nom: "Aide bovine – Corse",
        categorie: "Aides couplées animales",
        pilier: 1,
        calculable: true,
        source: "Annexe 8 – Paiements couplés animaux"
    },
    {
        id: "petits_ruminants_corse",
        nom: "Aide ovine et caprine – Corse",
        categorie: "Aides couplées animales",
        pilier: 1,
        calculable: "partiellement",
        source: "Annexe 8 – Paiements couplés animaux"
    },

    /* DÉVELOPPEMENT RURAL SURFACIQUE */
    {
        id: "ichn_animale",
        nom: "ICHN animale",
        categorie: "Développement rural",
        pilier: 2,
        calculable: "partiellement",
        source: "Annexe 9 – ICHN"
    },
    {
        id: "ichn_vegetale",
        nom: "ICHN végétale",
        categorie: "Développement rural",
        pilier: 2,
        calculable: true,
        source: "Annexe 9 – ICHN"
    },
    {
        id: "cab",
        nom: "Aide à la conversion à l'agriculture biologique",
        abreviation: "CAB",
        categorie: "Développement rural",
        pilier: 2,
        calculable: true,
        source: "Annexe 11 – Aide à la conversion à l'agriculture biologique"
    },
    {
        id: "maec_surfaciques",
        nom: "Mesures agroenvironnementales et climatiques surfaciques",
        abreviation: "MAEC",
        categorie: "Développement rural",
        pilier: 2,
        calculable: false,
        source: "Annexe 10 – MAEC"
    },

    /* GESTION DES RISQUES ET PRÉDATION */
    {
        id: "assurance_mrc",
        nom: "Aide à l'assurance multirisques climatique des récoltes",
        categorie: "Gestion des risques",
        pilier: 2,
        calculable: "reference",
        source: "Fiche Gestion des risques"
    },
    {
        id: "predation",
        nom: "Aide à la protection des troupeaux contre la prédation",
        categorie: "Prédation",
        pilier: 2,
        calculable: false,
        source: "Fiche Protection contre la prédation du loup et de l'ours"
    },

    /* PROGRAMMES SECTORIELS */
    {
        id: "programmes_sectoriels",
        nom: "Programmes sectoriels",
        categorie: "Interventions sectorielles",
        pilier: 1,
        calculable: false,
        source: "Fiche Programmes sectoriels – vin, fruits et légumes, huile d'olive, apiculture, protéines végétales, horticulture, veau Label rouge, lapin et riz"
    },

    /* AIDES RÉGIONALES */
    {
        id: "aides_regionales",
        nom: "Aides régionales du Feader",
        categorie: "Développement rural régional",
        pilier: 2,
        calculable: false,
        source: "Fiche Les aides des Régions"
    }
];

function obtenirAide(id) {
    return AIDES_PAC.find(aide => aide.id === id) || null;
}
