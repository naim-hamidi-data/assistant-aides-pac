/* =========================================================
   PROFIL D'EXPLOITATION
========================================================= */

const CLE_STOCKAGE_PROFIL = "assistant_pac_2026_profil_v2";

const PROFIL_INITIAL = {
    general: {
        campagne: 2026,
        territoire: "Hexagone", // Hexagone | Corse | Outre-mer
        region: null,
        departement: null,
        commune: null,
        statutJuridique: null,
        gaecTotal: false,
        nombreAssocies: 1
    },

    agriculteurActif: {
        statut: null // true | false | null
    },

    surfaces: {
        sau: null,
        surfaceAdmissible: null,
        terresArables: null,
        prairiesPermanentes: null,
        culturesPermanentes: null,
        surfaceFourragere: null,
        pourcentageHaiesSAU: null,
        pourcentageHaiesTerresArables: null
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
        age: null,
        diplomeAgricoleNiveau4OuPlus: null,
        diplomeNiveau3OuPlus: null,
        experienceAgricoleMois: null,
        nombreAssociesJAEligibles: null
    },

    environnement: {
        agricultureBiologique: null,
        hveRenovee: null,
        certificationCE2Plus: null,
        certificationGestionDurableHaies: null,
        maecEntretienLigneux: null
    },

    ecoregime: {
        pointsDiversification: null,
        pourcentagePrairiesNonLabourees: null,
        pourcentageInterRangsCouverts: null,
        pourcentageIAEEtJacheresSAU: null
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
            ugb: null,
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
        riz: {
            surface: null
        },
        houblon: {
            surface: null
        },
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
        }
    },

    bovins: {
        present: null,
        ugbTotal: null,
        ugbNiveauSuperieur: null,
        ugbNiveauBase: null,
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

    petitsRuminantsCorse: {
        nombreBrebis: null,
        nombreChevres: null,
        sousAOPBrocciu: null,
        detention100Jours: null,
        identificationConforme: null
    },

    ichn: {
        zoneEligible: null,
        typeZone: null, // haute_montagne | montagne | piemont | zone_defavorisee_simple
        zoneSeche: null,
        pourcentageSAUZoneDefavorisee: null,
        siegeEnZoneDefavorisee: null,
        partRevenuAgricolePourcent: null,
        aideAnimale: null,
        ugb: null,
        surfacesFourrageresEligibles: null,
        montantVariableSousZone: null,
        coefficientModulationChargement: null,
        aideVegetale: null,
        surfacesVegetalesEligibles: null
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
        type: null // systeme | localisee | inconnue
    },

    assurance: {
        souscritMRC: null,
        primeAnnuelle: null
    },

    predation: {
        zoneRisque: null
    },

    programmesSectoriels: {
        concerne: null,
        secteur: null, // vin | apiculture | fruits_legumes | huile_olive | proteines | horticulture | veau_label | lapin | riz
        membreOPAOP: null
    },

    regional: {
        souhaiteExaminer: null,
        type: null // investissement | installation | maec_forfaitaire | api | prm | gardiennage | betteraves | leader | cooperation | formation | autre
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

function lireProfil(chemin) {
    return chemin.split(".").reduce((objet, cle) => {
        if (objet === null || objet === undefined) return undefined;
        return objet[cle];
    }, profilExploitation);
}

function modifierProfil(chemin, valeur) {
    const parties = chemin.split(".");
    let objet = profilExploitation;

    parties.slice(0, -1).forEach(cle => {
        if (!objet[cle] || typeof objet[cle] !== "object") objet[cle] = {};
        objet = objet[cle];
    });

    objet[parties[parties.length - 1]] = valeur;
}

function sauvegarderProfilLocalement() {
    try {
        localStorage.setItem(CLE_STOCKAGE_PROFIL, JSON.stringify(profilExploitation));
    } catch (erreur) {
        console.warn("Impossible de sauvegarder le profil localement.", erreur);
    }
}

function chargerProfilLocal() {
    try {
        const brut = localStorage.getItem(CLE_STOCKAGE_PROFIL);
        if (!brut) return profilExploitation;
        const sauvegarde = JSON.parse(brut);
        profilExploitation = fusionnerProfondement(cloner(PROFIL_INITIAL), sauvegarde);
    } catch (erreur) {
        console.warn("Impossible de charger le profil local.", erreur);
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

function nombreOuZero(valeur) {
    const nombre = Number(valeur);
    return Number.isFinite(nombre) ? nombre : 0;
}

function estRenseigne(valeur) {
    return valeur !== null && valeur !== undefined && valeur !== "";
}

function sommeSurfacesFruitsTransformes() {
    const p = profilExploitation.productionsVegetales.fruitsTransformes;
    return [p.pruneEnte, p.ceriseBigarreau, p.poireWilliams, p.pechePavie, p.tomateIndustrie]
        .reduce((total, valeur) => total + nombreOuZero(valeur), 0);
}

function calculerSurfaceMaraichage() {
    const p = profilExploitation.productionsVegetales.maraichage;
    return nombreOuZero(p.surfaceLegumesFrais) + nombreOuZero(p.surfacePetitsFruitsRouges);
}

function aDesDPBActives() {
    return nombreOuZero(profilExploitation.dpb.nombreDPBActives) > 0;
}

function estCorse() {
    return profilExploitation.general.territoire === "Corse";
}

function estHexagone() {
    return profilExploitation.general.territoire === "Hexagone";
}

function normaliserTexte(texte) {
    return String(texte || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}
