/* =========================================================
   PARAMÈTRES PAC 2026

   Principe : ne jamais transformer automatiquement une
   référence 2024/2025 en montant 2026 lorsqu'une valeur
   annuelle 2026 n'est pas fournie par la source.
========================================================= */

const PARAMETRES_PAC_2026 = {
    campagne: 2026,
    versionSource: "Avril 2026",

    aideBase: {
        reference2024: {
            valeurMoyenneDPBHexagone: 128.80,
            valeurMoyenneDPBCorse: 144.64
        }
    },

    ecoregime: {
        niveauBase2026: null,
        niveauSuperieur2026: null,
        niveauBio2026: null,
        bonusHaies2026: null,
        reference2024: {
            // Le guide comporte deux valeurs pour le niveau de base : 48,23 et 48,35 €/ha.
            // Le simulateur n'en choisit aucune automatiquement.
            niveauBase: null,
            niveauBaseFicheSynthese: 48.23,
            niveauBaseAnnexe6: 48.35,
            niveauSuperieur: 66.17,
            niveauBio: 96.17,
            bonusHaies: 7.00
        }
    },

    aideRedistributive: {
        montant2026: null,
        reference2024: 50.26,
        hectaresMaximum: 52
    },

    ACJA: {
        montant2026: null,
        reference2024: 4469,
        dureeMaximumAnnees: 5
    },

    aidesCouplees: {
        vegetales: {
            legumineusesGraines: { montant2026: null, reference2024: 131.50 },
            legumineusesFourrageres: {
                plainePiemont: { montant2026: null, reference2024: 131.50 },
                montagne: { montant2026: null, reference2024: 152.00 }
            },
            bleDur: { montant2026: null, reference2024: 65.00 },
            pommeTerreFeculiere: { montant2026: null, reference2024: 92.16 },
            riz: { montant2026: null, reference2024: 143.00 },
            houblon: { montant2026: null, reference2024: 538.19 },
            semencesGraminees: { montant2026: null, reference2024: 48.27 },
            chanvre: { montant2026: null, reference2024: 63.00 },
            maraichage: { montant2026: null, reference2024: 1742.44 },
            fruitsTransformes: {
                pruneEnte: { montant2026: null, reference2024: 990.00 },
                ceriseBigarreau: { montant2026: null, reference2024: 647.30 },
                poireWilliams: { montant2026: null, reference2024: 1296.60 },
                pechePavie: { montant2026: null, reference2024: 561.52 },
                tomateIndustrie: { montant2026: null, reference2024: 1146.50 }
            }
        },
        animales: {
            bovinsHexagone: {
                base: { montant2026: null, reference2024: 58.37 },
                superieur: { montant2026: null, reference2024: 107.01 }
            },
            veauxQualite: { montant2026: null, reference2024: 68.70 },
            ovinsHexagone: {
                base: { montant2026: null, reference2024: 24.00 },
                nouveauProducteur: { montant2026: null, reference2024: 6.00 },
                majoration500Premieres: { montant2026: null, reference2024: 2.00 }
            },
            caprinsHexagone: { montant2026: null, reference2024: 14.56 },
            bovinsCorse: {
                base: { montant2026: null, reference2024: 50.00 },
                superieur: { montant2026: null, reference2024: 101.67 }
            },
            petitsRuminantsCorse: {
                brebisBase: { montant2026: null, reference2024: 25.05 },
                chevreBase: { montant2026: null, reference2024: 17.42 },
                brebisSuperieur: { montant2026: null, reference2024: 50.09 },
                // Le guide affiche 34,85 €/chèvre mais l'intitule à nouveau « montant de base ».
                // Par prudence, le simulateur n'utilise pas cette valeur comme niveau supérieur automatique.
                chevreValeurAmbigue: { montant2026: null, reference2024: 34.85 }
            }
        }
    },

    ICHN: {
        animale: {
            montantBaseParHa: 70,
            surfaceMaximum: 75,
            trancheVariablePleine: 25,
            trancheVariableReduiteJusqua: 50,
            coefficientDeuxiemeTranche: 2 / 3
        },
        vegetale: {
            montantZoneSecheParHa: 297,
            montantAutreZoneParHa: 35,
            surfaceMaximum: 50,
            premiereTranche: 25,
            coefficientDeuxiemeTranche: 2 / 3
        }
    },

    CAB: {
        engagementAnnees: 5,
        landesEstivesParcours: 44,
        prairiesAvecElevage: 130,
        culturesAnnuellesLegumineusesJacheresSemences: 350,
        viticulture: 350,
        ppamListees: 350,
        legumesPleinChampBetterave: 450,
        maraichageArboricultureAutresPpamSemences: 900
    },

    assuranceMRC: {
        taux2026: null,
        reference2025: 0.70
    },

    programmesSectoriels: {
        vin: { tauxMinimum: 0.15, tauxMaximum: 0.50 },
        apiculture: { tauxMinimum: 0.40, tauxMaximum: 1.00 },
        programmesOperationnels: { tauxMinimum: 0.50, tauxMaximum: 0.60 }
    }
};
