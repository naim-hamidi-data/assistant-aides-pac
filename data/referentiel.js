/* =========================================================
   ASSISTANT PAC — RÉFÉRENTIEL

   Référentiel de travail :
   « La nouvelle politique agricole commune – PAC 2023-2027 »
   version avril 2026, Ministère de l'Agriculture.

   IMPORTANT
   - Le site n'est pas daté dans son identité visuelle.
   - Les montants annuels non pérennes restent identifiés
     comme références 2024/2025 lorsqu'aucun montant plus
     récent n'est fourni par le guide.
   - Les dispositifs locaux restent des orientations lorsque
     le guide national ne fournit pas les paramètres nécessaires.
========================================================= */

const REFERENTIEL_PAC = {
    programmation: "PAC 2023-2027",
    versionSource: "Avril 2026",
    sourcePrincipale: "La nouvelle politique agricole commune – PAC 2023-2027",

    ecoregime: {
        seuilCategorieSignificative: 0.05,
        diversification: {
            niveauBasePoints: 4,
            niveauSuperieurPoints: 5,
            prairieTemporaireEtJachere: [
                { seuil: 0.50, points: 4 },
                { seuil: 0.30, points: 3 },
                { seuil: 0.05, points: 2 }
            ],
            legumineuses: [
                { seuil: 0.10, points: 3 },
                { seuil: 0.05, points: 2 }
            ],
            seuilLegumineusesHaAlternative: 5,
            blocCerealesSarcleesOleagineux: {
                cerealesHiver: { seuil: 0.10, points: 1 },
                cerealesPrintemps: { seuil: 0.10, points: 1 },
                plantesSarclees: { seuil: 0.10, points: 1 },
                oleagineuxHiver: { seuil: 0.07, points: 1 },
                oleagineuxPrintemps: { seuil: 0.05, points: 1 },
                plafondPoints: 4,
                secoursSiAucunSeuil: { seuilSomme: 0.10, points: 1 }
            },
            autresCultures: [
                { seuil: 0.75, points: 5 },
                { seuil: 0.50, points: 4 },
                { seuil: 0.25, points: 3 },
                { seuil: 0.10, points: 2 },
                { seuil: 0.05, points: 1 }
            ],
            prairiePermanenteDansSAU: [
                { seuil: 0.75, points: 3 },
                { seuil: 0.40, points: 2 },
                { seuil: 0.10, points: 1 }
            ],
            bonusTerresArablesMoins10Ha: 2
        },
        pratiques: {
            prairiePermanenteBase: 0.80,
            prairiePermanenteSuperieur: 0.90,
            culturesPermanentesBase: 0.75,
            culturesPermanentesSuperieur: 0.95
        },
        biodiversite: {
            base: 0.07,
            superieur: 0.10,
            equivalenceHaieHaParMetre: 0.002
        },
        bonusHaies: {
            seuilSAU: 0.06,
            seuilTerresArables: 0.06
        }
    },

    montantsReference: {
        aideBase: {
            moyenneDPB2024Hexagone: 128.80,
            moyenneDPB2024Corse: 144.64
        },
        ecoregime2024: {
            niveauBase: null,
            niveauBaseFicheSynthese: 48.23,
            niveauBaseAnnexe6: 48.35,
            niveauSuperieur: 66.17,
            niveauBio: 96.17,
            bonusHaies: 7.00
        },
        redistributive2024: 50.26,
        hectaresRedistributiveMaximum: 52,
        acja2024: 4469,
        aidesCouplees2024: {
            legumineusesGraines: 131.50,
            legumineusesFourrageresPlainePiemont: 131.50,
            legumineusesFourrageresMontagne: 152.00,
            bleDur: 65.00,
            pommeTerreFeculiere: 92.16,
            riz: 143.00,
            houblon: 538.19,
            semencesGraminees: 48.27,
            chanvre: 63.00,
            petitMaraichage: 1742.44,
            pruneEnte: 990.00,
            ceriseBigarreau: 647.30,
            poireWilliams: 1296.60,
            pechePavie: 561.52,
            tomateIndustrie: 1146.50,
            bovinsHexagoneBase: 58.37,
            bovinsHexagoneSuperieur: 107.01,
            veauxQualite: 68.70,
            ovinsBase: 24.00,
            ovinsNouveauProducteur: 6.00,
            ovinsMajoration500: 2.00,
            caprins: 14.56,
            bovinsCorseBase: 50.00,
            bovinsCorseSuperieur: 101.67,
            brebisCorseBase: 25.05,
            chevreCorseBase: 17.42,
            brebisCorseSuperieur: 50.09,
            chevreCorseValeurAmbigue: 34.85
        },
        assuranceMRC2025: 0.70
    },

    ichn: {
        animale: {
            surfaceFourragereMinimum: 3,
            ugbMinimum: 5,
            montantBaseParHa: 70,
            surfaceMaximum: 75,
            trancheVariablePleine: 25,
            trancheVariableReduiteFin: 50,
            coefficientDeuxiemeTranche: 2 / 3
        },
        vegetale: {
            surfaceMinimum: 1,
            surfaceMaximum: 50,
            premiereTranche: 25,
            coefficientDeuxiemeTranche: 2 / 3,
            zoneSecheParHa: 297,
            autreZoneParHa: 35
        }
    },

    cab: {
        dureeEngagementAnnees: 5,
        tarifs: {
            landesEstivesParcours: 44,
            prairiesAvecElevage: 130,
            culturesAnnuellesLegumineusesJacheresSemences: 350,
            viticulture: 350,
            ppamListees: 350,
            legumesPleinChampBetterave: 450,
            maraichageArboricultureAutresPpamSemences: 900
        }
    },

    programmesSectoriels: {
        vin: { tauxMin: 0.15, tauxMax: 0.50 },
        apiculture: { tauxMin: 0.40, tauxMax: 1.00 },
        programmesOperationnels: { tauxMin: 0.50, tauxMax: 0.60 }
    }
};

const AIDES_PAC = [
    { id: "aide_base", nom: "Aide de base au revenu", categorie: "Paiements découplés", source: "Annexe 5 – Régime des DPB" },
    { id: "ecoregime", nom: "Écorégime", categorie: "Paiements découplés", source: "Annexe 6 – Écorégime" },
    { id: "aide_redistributive", nom: "Aide redistributive complémentaire au revenu", categorie: "Paiements découplés", source: "Fiche aide redistributive" },
    { id: "acja", nom: "Aide complémentaire au revenu pour les jeunes agriculteurs", categorie: "Paiements découplés", source: "Fiche ACJA" },

    { id: "legumineuses_graines", nom: "Légumineuses à graines, déshydratation et semences", categorie: "Aides couplées végétales", source: "Annexe 7" },
    { id: "legumineuses_fourrageres", nom: "Légumineuses fourragères", categorie: "Aides couplées végétales", source: "Annexe 7" },
    { id: "ble_dur", nom: "Aide couplée au blé dur", categorie: "Aides couplées végétales", source: "Annexe 7" },
    { id: "pomme_terre_feculiere", nom: "Aide à la pomme de terre féculière", categorie: "Aides couplées végétales", source: "Annexe 7" },
    { id: "riz", nom: "Aide couplée au riz", categorie: "Aides couplées végétales", source: "Annexe 7" },
    { id: "houblon", nom: "Aide couplée au houblon", categorie: "Aides couplées végétales", source: "Annexe 7" },
    { id: "semences_graminees", nom: "Aide aux semences de graminées prairiales", categorie: "Aides couplées végétales", source: "Annexe 7" },
    { id: "chanvre", nom: "Aide couplée au chanvre", categorie: "Aides couplées végétales", source: "Annexe 7" },
    { id: "petit_maraichage", nom: "Aide couplée au petit maraîchage", categorie: "Aides couplées végétales", source: "Annexe 7" },
    { id: "fruits_transformes", nom: "Productions destinées à la transformation", categorie: "Aides couplées végétales", source: "Annexe 7" },

    { id: "bovins_hexagone", nom: "Aide bovine – Hexagone", categorie: "Aides couplées animales", source: "Annexe 8" },
    { id: "veaux_qualite", nom: "Veaux sous la mère et veaux bio", categorie: "Aides couplées animales", source: "Annexe 8" },
    { id: "ovins_hexagone", nom: "Aide ovine – Hexagone", categorie: "Aides couplées animales", source: "Annexe 8" },
    { id: "caprins_hexagone", nom: "Aide caprine – Hexagone", categorie: "Aides couplées animales", source: "Annexe 8" },
    { id: "bovins_corse", nom: "Aide bovine – Corse", categorie: "Aides couplées animales", source: "Annexe 8" },
    { id: "petits_ruminants_corse", nom: "Aide ovine et caprine – Corse", categorie: "Aides couplées animales", source: "Annexe 8" },

    { id: "ichn_animale", nom: "ICHN animale", categorie: "Développement rural", source: "Annexe 9" },
    { id: "ichn_vegetale", nom: "ICHN végétale", categorie: "Développement rural", source: "Annexe 9" },
    { id: "cab", nom: "Aide à la conversion à l'agriculture biologique", categorie: "Développement rural", source: "Annexe 11" },
    { id: "maec_surfaciques", nom: "MAEC surfaciques", categorie: "Développement rural", source: "Annexe 10" },
    { id: "assurance_mrc", nom: "Aide à l'assurance multirisques climatique", categorie: "Gestion des risques", source: "Fiche gestion des risques" },
    { id: "predation", nom: "Protection contre la prédation du loup et de l'ours", categorie: "Prédation", source: "Fiche prédation" },
    { id: "programmes_sectoriels", nom: "Programmes sectoriels", categorie: "Interventions sectorielles", source: "Fiche programmes sectoriels" },
    { id: "aides_regionales", nom: "Aides régionales du Feader", categorie: "Développement rural régional", source: "Fiche aides des Régions" }
];

function obtenirAide(id) {
    return AIDES_PAC.find(aide => aide.id === id) || null;
}
