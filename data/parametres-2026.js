/* =========================================================
   PARAMÈTRES DE CAMPAGNE — PAC 2026

   Les valeurs 2026 non définitivement connues dans
   le document source restent à null.

   Les valeurs antérieures servent uniquement de référence.
========================================================= */

const PARAMETRES_PAC_2026 = {

    campagne: 2026,

    aideBase: {

        montant2026: null,

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
            niveauSuperieur: 66.17
        },

        note:
            "Les montants sont calculés annuellement. Ne pas utiliser automatiquement les valeurs 2024 comme montants 2026."
    },


    aideRedistributive: {

        montant2026: null,

        reference2024: {
            montantParHa: 50.26
        },

        hectaresMaximum: 52
    },


    ACJA: {

        montant2026: null,

        reference2024: {
            montantParExploitation: 4469
        }
    }

};
