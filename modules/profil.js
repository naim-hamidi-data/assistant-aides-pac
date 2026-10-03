/* =========================================================
   ASSISTANT & SIMULATEUR D'AIDES PAC 2026
   PROFIL DE L'EXPLOITATION

   Ce fichier contient les données utilisées par :
   - le questionnaire
   - le moteur d'orientation
   - le moteur d'éligibilité
   - le simulateur financier
   - les scénarios

   Les valeurs null signifient :
   "information non renseignée / inconnue"
========================================================= */


/* =========================================================
   1. PROFIL INITIAL
========================================================= */

const PROFIL_INITIAL = {

    /* -----------------------------------------------------
       A. INFORMATIONS GÉNÉRALES
    ----------------------------------------------------- */

    general: {

        campagne: 2026,

        territoire: {
            pays: "France",
            zone: null,          // Hexagone / Corse / Outre-mer
            region: null,
            departement: null,
            commune: null
        },

        statutJuridique: null,

        // Exemples :
        // individuel
        // GAEC
        // EARL
        // SCEA
        // SAS
        // SARL
        // SA
        // autre

        nombreAssocies: null,

        gaecTotal: false
    },


    /* -----------------------------------------------------
       B. AGRICULTEUR ACTIF
    ----------------------------------------------------- */

    agriculteurActif: {

        statut: null,
        // true / false / null

        typeDemandeur: null,
        // personne_physique / societe

        age: null,

        assureATEXA: null,

        droitsRetraiteLiquides: null,

        activiteAgricole: null,

        /* Pour certaines sociétés */
        auMoinsUnAssocieActif: null,

        dirigeantsAffiliesRegimeAgricole: null,

        commentaire: null
    },


    /* -----------------------------------------------------
       C. SURFACES
    ----------------------------------------------------- */

    surfaces: {

        sau: null,

        surfaceAdmissible: null,

        terresArables: null,

        prairiesPermanentes: null,

        culturesPermanentes: null,

        surfaceFourragere: null,

        jacheres: null,

        surfaceIAE: null,

        /* Haies */
        longueurHaiesMetres: null,

        surfaceEquivalentHaies: null,

        pourcentageHaiesSAU: null,

        pourcentageHaiesTerresArables: null
    },


    /* -----------------------------------------------------
       D. DPB
    ----------------------------------------------------- */

    dpb: {

        detientDPB: null,

        nombreDPB: null,

        nombreDPBActives: null,

        valeurMoyenneDPB: null,

        valeurTotaleDPB: null,

        /* Pour nouveaux installés / transferts */
        demandeReserve: null,

        transfertDPB: null
    },


    /* -----------------------------------------------------
       E. INSTALLATION / JEUNE AGRICULTEUR
    ----------------------------------------------------- */

    installation: {

        premiereInstallation: null,

        anneeInstallation: null,

        jeuneAgriculteur: null,

        age: null,

        diplomeAgricoleNiveau4OuPlus: null,

        diplomeNiveau3OuPlus: null,

        experienceAgricoleMois: null,

        dejaBeneficiaireACJA: null,

        nombreAnneesACJADejaPercues: null
    },


    /* -----------------------------------------------------
       F. CERTIFICATIONS / ENVIRONNEMENT
    ----------------------------------------------------- */

    environnement: {

        agricultureBiologique: null,

        enConversionBio: null,

        hveRenovee: null,

        certificationCE2Plus: null,

        certificationGestionDurableHaies: null,

        engageMAEC: null,

        typeMAEC: null
    },


    /* -----------------------------------------------------
       G. ÉCORÉGIME
    ----------------------------------------------------- */

    ecoregime: {

        voieSouhaitee: null,
        // pratiques / certification / biodiversite

        niveauEstime: null,
        // base / superieur / bio

        /* Voie des pratiques */

        diversificationCulturesRespectee: null,

        pourcentagePrairiesNonLabourees: null,

        pourcentageInterRangsCouverts: null,

        /* Voie biodiversité */

        pourcentageIAEEtJacheresSAU: null,

        /* Bonus haies */

        bonusHaiesPotentiel: null
    },


    /* -----------------------------------------------------
       H. PRODUCTIONS VÉGÉTALES
    ----------------------------------------------------- */

    productionsVegetales: {

        legumineusesGraines: {
            presente: false,
            surface: null,
            type: null,
            pourcentageProteagineuxMelange: null
        },

        legumineusesFourrageres: {
            presente: false,
            surface: null,
            zone: null,
            // plaine_piemont / montagne

            melange: null,
            pourcentageLegumineuses: null,
            anneeSemis: null,

            contratEleveur: null,
            contratDeshydratation: null,

            destinationSemences: null
        },

        bleDur: {
            presente: false,
            surface: null,
            contratCollecteur: null
        },

        pommeTerreFeculiere: {
            presente: false,
            surface: null,
            contratTransformation: null
        },

        riz: {
            presente: false,
            surface: null
        },

        houblon: {
            presente: false,
            surface: null
        },

        semencesGraminees: {
            presente: false,
            surface: null,
            contratCulture: null,
            varieteAutorisee: null
        },

        chanvre: {
            presente: false,
            surface: null,
            contratTransformation: null
        },

        maraichage: {
            presente: false,
            surfaceLegumesFrais: null,
            surfacePetitsFruitsRouges: null
        },

        fruitsTransformes: {

            pruneEnte: {
                presente: false,
                surface: null,
                deboucheIndustriel: null
            },

            ceriseBigarreau: {
                presente: false,
                surface: null,
                deboucheIndustriel: null
            },

            poireWilliams: {
                presente: false,
                surface: null,
                deboucheIndustriel: null
            },

            pechePavie: {
                presente: false,
                surface: null,
                deboucheIndustriel: null
            },

            tomateIndustrie: {
                presente: false,
                surface: null,
                deboucheIndustriel: null
            }
        }
    },


    /* -----------------------------------------------------
       I. ÉLEVAGE BOVIN
    ----------------------------------------------------- */

    bovins: {

        present: false,

        nombreTotal: null,

        ugbEligibles: null,

        ugbNiveauSuperieur: null,

        ugbNiveauBase: null,

        bovinsPlus16Mois: null,

        bovinsPlus2Ans: null,

        bovins6Mois2Ans: null,

        nombreVachesEligibles: null,

        nombreVeauxViandeNes: null,

        animauxDetenus6Mois: null,

        identificationConforme: null
    },


    /* -----------------------------------------------------
       J. VEAUX SOUS LA MÈRE / BIO
    ----------------------------------------------------- */

    veauxQualite: {

        present: false,

        nombreVeauxEligibles: null,

        labelRouge: null,

        igpRoseePyreneesCatalanes: null,

        agricultureBiologique: null,

        detention45Jours: null,

        identificationConforme: null
    },


    /* -----------------------------------------------------
       K. OVINS
    ----------------------------------------------------- */

    ovins: {

        present: false,

        nombreBrebis: null,

        nombreBrebisEligibles: null,

        nombreAgneauxVendusNMoins1: null,

        ratioProductivite: null,

        detention100Jours: null,

        identificationConforme: null,

        nouveauProducteur: null,

        anneeCreationAtelier: null
    },


    /* -----------------------------------------------------
       L. CAPRINS
    ----------------------------------------------------- */

    caprins: {

        present: false,

        nombreChevres: null,

        nombreChevresEligibles: null,

        detention100Jours: null,

        identificationConforme: null
    },


    /* -----------------------------------------------------
       M. ICHN
    ----------------------------------------------------- */

    ichn: {

        zoneEligible: null,

        typeZone: null,
        // montagne
        // haute_montagne
        // autre_zone_defavorisee

        aideAnimale: null,

        aideVegetale: null,

        ugb: null,

        surfacesFourrageresEligibles: null,

        surfacesVegetalesEligibles: null
    },


    /* -----------------------------------------------------
       N. CONVERSION BIO
    ----------------------------------------------------- */

    conversionBio: {

        concernee: false,

        surfacesEnConversion: null,

        culturesEnConversion: []
    },


    /* -----------------------------------------------------
       O. MAEC
    ----------------------------------------------------- */

    maec: {

        concernee: false,

        dispositif: null,

        surfaceEngagee: null,

        engagementSysteme: null,

        engagementLocalise: null
    },


    /* -----------------------------------------------------
       P. ASSURANCE MULTIRISQUES CLIMATIQUE
    ----------------------------------------------------- */

    assuranceMRC: {

        contratSouscrit: null,

        surfaceAssuree: null,

        montantPrime: null
    }

};


/* =========================================================
   2. PROFIL ACTUEL
========================================================= */

let profilExploitation = JSON.parse(
    JSON.stringify(PROFIL_INITIAL)
);


/* =========================================================
   3. OUTILS DE MODIFICATION DU PROFIL
========================================================= */


/**
 * Modifie une valeur du profil à partir d'un chemin.
 *
 * Exemple :
 * modifierProfil("surfaces.sau", 82);
 * modifierProfil("bovins.present", true);
 */
function modifierProfil(chemin, valeur) {

    const cles = chemin.split(".");

    let cible = profilExploitation;

    for (let i = 0; i < cles.length - 1; i++) {

        if (cible[cles[i]] === undefined) {
            console.warn(
                "Chemin profil inexistant :",
                chemin
            );
            return;
        }

        cible = cible[cles[i]];
    }

    cible[cles[cles.length - 1]] = valeur;
}


/**
 * Lit une valeur du profil.
 *
 * Exemple :
 * const sau = lireProfil("surfaces.sau");
 */
function lireProfil(chemin) {

    const cles = chemin.split(".");

    let valeur = profilExploitation;

    for (const cle of cles) {

        if (
            valeur === undefined ||
            valeur === null ||
            valeur[cle] === undefined
        ) {
            return null;
        }

        valeur = valeur[cle];
    }

    return valeur;
}


/* =========================================================
   4. REMISE À ZÉRO
========================================================= */

function reinitialiserProfil() {

    profilExploitation = JSON.parse(
        JSON.stringify(PROFIL_INITIAL)
    );

    supprimerProfilSauvegarde();
}


/* =========================================================
   5. SAUVEGARDE LOCALE
========================================================= */

const CLE_STOCKAGE_PROFIL =
    "assistant-pac-2026-profil";


function sauvegarderProfilLocalement() {

    try {

        localStorage.setItem(
            CLE_STOCKAGE_PROFIL,
            JSON.stringify(profilExploitation)
        );

        return true;

    } catch (erreur) {

        console.error(
            "Impossible de sauvegarder le profil.",
            erreur
        );

        return false;
    }
}


function chargerProfilLocal() {

    try {

        const profilSauvegarde =
            localStorage.getItem(CLE_STOCKAGE_PROFIL);

        if (!profilSauvegarde) {
            return false;
        }

        profilExploitation =
            JSON.parse(profilSauvegarde);

        return true;

    } catch (erreur) {

        console.error(
            "Impossible de charger le profil.",
            erreur
        );

        return false;
    }
}


function supprimerProfilSauvegarde() {

    localStorage.removeItem(
        CLE_STOCKAGE_PROFIL
    );
}


/* =========================================================
   6. FONCTIONS UTILES
========================================================= */


/**
 * Retourne true si au moins un DPB
 * peut être considéré comme activé.
 */
function aDesDPBActives() {

    return (
        profilExploitation.dpb.nombreDPBActives !== null &&
        profilExploitation.dpb.nombreDPBActives > 0
    );
}


/**
 * Retourne le nombre maximal d'hectares
 * potentiellement couverts par les DPB.
 */
function surfacePotentiellementCouverteParDPB() {

    const surface =
        profilExploitation.surfaces.surfaceAdmissible;

    const dpb =
        profilExploitation.dpb.nombreDPBActives;

    if (surface === null || dpb === null) {
        return null;
    }

    return Math.min(surface, dpb);
}


/**
 * Calcule automatiquement le ratio
 * de productivité ovine lorsque les données
 * nécessaires sont connues.
 */
function calculerRatioProductiviteOvine() {

    const brebis =
        profilExploitation.ovins.nombreBrebis;

    const agneaux =
        profilExploitation.ovins.nombreAgneauxVendusNMoins1;

    if (
        brebis === null ||
        agneaux === null ||
        brebis <= 0
    ) {
        return null;
    }

    const ratio = agneaux / brebis;

    profilExploitation.ovins.ratioProductivite =
        ratio;

    return ratio;
}


/**
 * Calcule la surface totale de maraîchage
 * saisie dans le profil.
 */
function calculerSurfaceMaraichage() {

    const legumes =
        profilExploitation.productionsVegetales
            .maraichage.surfaceLegumesFrais || 0;

    const fruits =
        profilExploitation.productionsVegetales
            .maraichage.surfacePetitsFruitsRouges || 0;

    return legumes + fruits;
}


/**
 * Indique si le profil contient encore
 * des informations essentielles manquantes.
 */
function profilMinimumComplet() {

    return (
        profilExploitation.general.statutJuridique !== null &&
        profilExploitation.agriculteurActif.statut !== null &&
        profilExploitation.surfaces.sau !== null &&
        profilExploitation.surfaces.surfaceAdmissible !== null
    );
}
