/* =========================================================
   PROFIL D'EXPLOITATION — V2

   L'agriculteur renseigne des faits sur son exploitation.
   Les indicateurs PAC sont ensuite calculés automatiquement
   dans modules/indicateurs.js.
========================================================= */

const CLE_STOCKAGE_PROFIL = "assistant_pac_profil_v3";

const PROFIL_INITIAL = {
    general: {
        anneeDemande: null,
        territoire: "Hexagone", // Hexagone | Corse | Outre-mer
        region: null,
        departement: null,
        commune: null,
        statutJuridique: null,
        gaecTotal: false,
        nombreAssocies: 1
    },

    statutActif: {
        /* Personne physique */
        ageExploitant: null,
        affilieATEXA: null,
        retraiteLiquideeApres67: null,

        /* Société avec associé relevant du modèle personne physique */
        associeAffilieATEXA: null,
        associeRespecteCritereAgeRetraite: null,

        /* Société sans associé ATEXA */
        sansAssocieATEXA: null,
        activiteAgricoleSociete: null,
        dirigeantsAffiliesATMPAgricole: null,
        dirigeantsRespectentRetraite: null,
        dirigeantsDetiennent5Pourcent: null,

        /* Autres personnes morales */
        autrePersonneMoraleActiviteAgricoleStatutaire: null
    },

    surfaces: {
        sau: null,
        surfaceAdmissible: null,
        terresArables: null,
        prairiesPermanentes: null,
        culturesPermanentes: null,
        surfaceFourragere: null
    },

    assolement: {
        /* Catégories officielles utilisées pour le score écorégime */
        prairieTemporaire: null,
        jachereTotale: null,
        jachereEcoEligible: null,
        legumineuses: null,
        cerealesHiver: null,
        cerealesPrintemps: null,
        plantesSarclees: null,
        oleagineuxHiver: null,
        oleagineuxPrintemps: null,
        autresCultures: null
    },

    pratiques: {
        surfacePPRespectantCritereEcoregime: null,
        surfaceCPCouverteEcoregime: null,
        iaeAutresEquivalentHa: null,
        longueurHaiesTotaleM: null,
        longueurHaiesTerresArablesM: null,
        certificationHaiesDurables: null,
        maecEntretienLigneux: null,
        agricultureBiologiqueTouteExploitation: null,
        hveRenovee: null,
        certificationCE2Plus: null
    },

    dpb: {
        detientDPB: null,
        nombreDPB: null,
        nombreDPBActives: null,
        valeurMoyenneDPB: null,
        valeurTotaleDPB: null
    },

    installation: {
        premiereInstallation: null,
        anneeInstallation: null,
        ageJA: null,
        diplomeAgricoleNiveau4OuPlus: null,
        diplomeNiveau3OuPlus: null,
        experienceAgricoleMois: null,
        nombreAssociesJAEligibles: null
    },

    productionsVegetales: {
        legumineusesGraines: {
            surface: null,
            destination: null, // graines | deshydratation | semences
            contratDeshydratation: null,
            melangeProteagineuxPourcent: null
        },
        legumineusesFourrageres: {
            surface: null,
            zone: null, // plaine_piemont | montagne
            contratEleveur5UGB: null,
            melangeLegumineusesPourcent: null,
            melangeAvecGraminees: null,
            anneeSemis: null
        },
        bleDur: {
            surface: null,
            contratCollecteur: null
        },
        pommeTerreFeculiere: {
            surface: null,
            contratTransformation: null
        },
        riz: { surface: null },
        houblon: { surface: null },
        semencesGraminees: {
            surface: null,
            contratCulture: null,
            varieteAutorisee: null,
            usageGazonUniquement: null
        },
        chanvre: {
            surface: null,
            contratTransformationOuSemences: null,
            thcConforme: null
        },
        maraichage: {
            surfaceLegumesFrais: null,
            surfacePetitsFruitsRouges: null
        },
        fruitsTransformes: {
            pruneEnte: null,
            ceriseBigarreau: null,
            poireWilliams: null,
            pechePavie: null,
            tomateIndustrie: null,
            deboucheIndustriel: null
        },
        autres: {
            viticulture: null,
            oliveraie: null,
            horticulture: null,
            ppam: null
        }
    },

    bovins: {
        present: null,
        vachesEligibles: null,
        malesPlus2Ans: null,
        males16a24Mois: null,
        femellesRaceViandePlus2Ans: null,
        femellesRaceViande16a24Mois: null,
        autresFemellesPlus2Ans: null,
        autresFemelles16a24Mois: null,
        veauxRaceViandeNesGardes90Jours: null,
        animauxDetenus6Mois: null,
        identificationConforme: null
    },

    veauxQualite: {
        present: null,
        nombreVeauxEligibles: null,
        labelRouge: null,
        igpRoseePyreneesCatalanes: null,
        agricultureBiologique: null,
        detention45Jours: null,
        identificationConforme: null
    },

    ovins: {
        present: null,
        nombreBrebis: null,
        nombreBrebisPresentes1JanvierNMoins1: null,
        nombreAgneauxVendusNMoins1: null,
        detention100Jours: null,
        identificationConforme: null,
        nouveauProducteur: null
    },

    caprins: {
        present: null,
        nombreChevres: null,
        detention100Jours: null,
        identificationConforme: null
    },

    autresAnimaux: {
        /* Valeur optionnelle issue d'un dossier / logiciel si l'exploitation
           possède des herbivores ou monogastriques dont le guide ne donne pas
           les coefficients UGB nécessaires au calcul automatique. */
        ugbDeclareesHorsBovins: null,
        nombreLapins: null,
        nombreRuches: null
    },

    corse: {
        sousAOPBrocciu: null
    },

    ichn: {
        zoneEligible: null,
        typeZone: null, // haute_montagne | montagne | piemont | zone_defavorisee_simple
        zoneSeche: null,
        pourcentageSAUZoneDefavorisee: null,
        siegeEnZoneDefavorisee: null,
        partRevenuAgricolePourcent: null,
        surfacesFourrageresEligibles: null,
        surfacesVegetalesEligibles: null,
        montantVariableSousZone: null,
        coefficientModulationChargement: null
    },

    conversionBio: {
        enConversion: null,
        premiereOuDeuxiemeAnnee: null,
        landesEstivesParcours: null,
        prairiesAvecElevage: null,
        culturesAnnuellesLegumineusesJacheresSemences: null,
        viticulture: null,
        ppamListees: null,
        legumesPleinChampBetterave: null,
        maraichageArboricultureAutresPpamSemences: null
    },

    maec: {
        souhaiteExaminer: null,
        offreLocaleConnue: null,
        type: null
    },

    assurance: {
        souscritMRC: null,
        primeAnnuelle: null
    },

    predation: {
        zoneRisque: null
    },

    programmesSectoriels: {
        membreOPAOP: null
    },

    regional: {
        projetPrincipal: null
    }
};

function cloner(objet) {
    return JSON.parse(JSON.stringify(objet));
}

function fusionnerProfondement(cible, source) {
    if (!source || typeof source !== "object") return cible;
    Object.keys(source).forEach(cle => {
        const valeur = source[cle];
        if (
            valeur &&
            typeof valeur === "object" &&
            !Array.isArray(valeur) &&
            cible[cle] &&
            typeof cible[cle] === "object"
        ) {
            fusionnerProfondement(cible[cle], valeur);
        } else {
            cible[cle] = valeur;
        }
    });
    return cible;
}

let profilExploitation = cloner(PROFIL_INITIAL);

function nombreOuZero(valeur) {
    const nombre = Number(valeur);
    return Number.isFinite(nombre) ? nombre : 0;
}

function estRenseigne(valeur) {
    return valeur !== null && valeur !== undefined && valeur !== "";
}

function normaliserTexte(texte) {
    return String(texte || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function lireChemin(objet, chemin) {
    return chemin.split(".").reduce((courant, cle) => {
        if (courant === null || courant === undefined) return undefined;
        return courant[cle];
    }, objet);
}

function ecrireChemin(objet, chemin, valeur) {
    const morceaux = chemin.split(".");
    const derniere = morceaux.pop();
    let courant = objet;
    morceaux.forEach(cle => {
        if (!courant[cle] || typeof courant[cle] !== "object") courant[cle] = {};
        courant = courant[cle];
    });
    courant[derniere] = valeur;
}

function lireProfil(chemin) {
    return lireChemin(profilExploitation, chemin);
}

function modifierProfil(chemin, valeur) {
    ecrireChemin(profilExploitation, chemin, valeur);
}

function sauvegarderProfilLocalement() {
    try {
        localStorage.setItem(CLE_STOCKAGE_PROFIL, JSON.stringify(profilExploitation));
    } catch (erreur) {
        console.warn("Sauvegarde locale impossible", erreur);
    }
}

function chargerProfilLocal() {
    try {
        const brut = localStorage.getItem(CLE_STOCKAGE_PROFIL);
        if (!brut) return profilExploitation;
        const ancien = JSON.parse(brut);
        profilExploitation = fusionnerProfondement(cloner(PROFIL_INITIAL), ancien);
    } catch (erreur) {
        console.warn("Chargement du profil impossible", erreur);
        profilExploitation = cloner(PROFIL_INITIAL);
    }
    return profilExploitation;
}

function reinitialiserProfil() {
    profilExploitation = cloner(PROFIL_INITIAL);
    try {
        localStorage.removeItem(CLE_STOCKAGE_PROFIL);
    } catch (_) {}
    return profilExploitation;
}

function estHexagone() {
    return profilExploitation.general.territoire === "Hexagone";
}

function estCorse() {
    return profilExploitation.general.territoire === "Corse";
}

function aDesDPBActives() {
    return nombreOuZero(profilExploitation.dpb.nombreDPBActives) > 0;
}

function calculerSurfaceMaraichage() {
    const m = profilExploitation.productionsVegetales.maraichage;
    return nombreOuZero(m.surfaceLegumesFrais) + nombreOuZero(m.surfacePetitsFruitsRouges);
}

function sommeSurfacesFruitsTransformes() {
    const f = profilExploitation.productionsVegetales.fruitsTransformes;
    return [f.pruneEnte, f.ceriseBigarreau, f.poireWilliams, f.pechePavie, f.tomateIndustrie]
        .reduce((total, valeur) => total + nombreOuZero(valeur), 0);
}
