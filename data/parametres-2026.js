/* =========================================================
   ASSISTANT & SIMULATEUR D'AIDES PAC 2026
   PARAMÈTRES DE CAMPAGNE
========================================================= */

const PARAMETRES_PAC_2026 = {

    campagne: 2026,


    /* =====================================================
       AIDE DE BASE / DPB
    ===================================================== */

    aideBase: {

        montant2026: null,

        reference2024: {

            valeurMoyenneDPBHexagone: 128.80,

            valeurMoyenneDPBCorse: 144.64
        }
    },


    /* =====================================================
       ÉCORÉGIME
    ===================================================== */

    ecoregime: {

        niveauBase2026: null,

        niveauSuperieur2026: null,

        niveauBio2026: null,

        bonusHaies2026: null,


        reference2024: {

            /*
               Le PDF contient deux valeurs différentes
               pour le niveau de base :

               - 48,23 €/ha dans la fiche synthétique
               - 48,35 €/ha dans l'annexe 6

               On ne tranche donc pas automatiquement.
            */

            niveauBase: null,

            niveauBaseFicheSynthese: 48.23,

            niveauBaseAnnexe6: 48.35,

            niveauSuperieur: 66.17,

            niveauBio: 96.17,

            bonusHaies: 7.00
        },


        note:
            "Les montants sont calculés annuellement. Ne pas utiliser automatiquement les valeurs 2024 comme montants 2026."
    },


    /* =====================================================
       AIDE REDISTRIBUTIVE
    ===================================================== */

    aideRedistributive: {

        montant2026: null,

        reference2024: {

            montantParHa: 50.26
        },

        hectaresMaximum: 52
    },


    /* =====================================================
       ACJA
    ===================================================== */

    ACJA: {

        montant2026: null,

        reference2024: {

            montantParExploitation: 4469
        }
    }

};


/* =========================================================
   AIDES COUPLÉES
========================================================= */

PARAMETRES_PAC_2026.aidesCouplees = {


    /* =====================================================
       AIDES COUPLÉES VÉGÉTALES
    ===================================================== */

    vegetales: {


        legumineusesGraines: {

            montant2026: null,

            reference2024: 131.50
        },


        legumineusesFourrageres: {

            plainePiemont: {

                montant2026: null,

                reference2024: 131.50
            },


            montagne: {

                montant2026: null,

                reference2024: 152.00
            }
        },


        bleDur: {

            montant2026: null,

            reference2024: 65.00
        },


        pommeTerreFeculiere: {

            montant2026: null,

            reference2024: 92.16
        },


        riz: {

            montant2026: null,

            reference2024: 143.00
        },


        houblon: {

            montant2026: null,

            reference2024: 538.19
        },


        semencesGraminees: {

            montant2026: null,

            reference2024: 48.27
        },


        chanvre: {

            montant2026: null,

            reference2024: 63.00
        },


        maraichage: {

            montant2026: null,

            reference2024: 1742.44
        },


        fruitsTransformes: {


            pruneEnte: {

                montant2026: null,

                reference2024: 990.00
            },


            ceriseBigarreau: {

                montant2026: null,

                reference2024: 647.30
            },


            poireWilliams: {

                montant2026: null,

                reference2024: 1296.60
            },


            pechePavie: {

                montant2026: null,

                reference2024: 561.52
            },


            tomateIndustrie: {

                montant2026: null,

                reference2024: 1146.50
            }
        }
    },


    /* =====================================================
       AIDES COUPLÉES ANIMALES
    ===================================================== */

    animales: {


        bovinsHexagone: {


            base: {

                montant2026: null,

                reference2024: 58.37
            },


            superieur: {

                montant2026: null,

                reference2024: 107.01
            }
        },


        veauxQualite: {

            montant2026: null,

            reference2024: 68.70
        },


        ovinsHexagone: {


            base: {

                montant2026: null,

                reference2024: 24.00
            },


            nouveauProducteur: {

                montant2026: null,

                reference2024: 6.00
            },


            majoration500Premieres: {

                montant2026: null,

                reference2024: 2.00
            }
        },


        caprinsHexagone: {

            montant2026: null,

            reference2024: 14.56
        }
    }

};
