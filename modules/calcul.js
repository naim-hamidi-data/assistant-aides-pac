/* =========================================================
   MOTEUR DE CALCUL
========================================================= */

const TYPE_CALCUL = {
    CAMPAGNE_2026: "campagne_2026",
    PROFIL_EXPLOITATION: "profil_exploitation",
    REFERENCE_2024: "reference_2024",
    REFERENCE_2025: "reference_2025",
    PARTIEL: "partiel",
    NON_CALCULABLE: "non_calculable"
};

function arrondirMontant(montant) {
    if (!Number.isFinite(Number(montant))) return null;
    return Math.round(Number(montant) * 100) / 100;
}

function formaterMontant(montant) {
    if (montant === null || montant === undefined || !Number.isFinite(Number(montant))) return "—";
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(montant));
}

function creerCalcul({
    id,
    nom = null,
    montant = null,
    type = TYPE_CALCUL.NON_CALCULABLE,
    anneeReference = null,
    formule = null,
    donnees = {},
    avertissements = [],
    details = {}
}) {
    const aide = obtenirAide(id);
    const valeur = montant === null ? null : arrondirMontant(montant);
    return {
        id,
        nom: nom || (aide ? aide.nom : id),
        montant: valeur,
        montantFormate: formaterMontant(valeur),
        type,
        anneeReference,
        formule,
        donnees,
        avertissements,
        details
    };
}

function choisirTarif(montant2026, reference, anneeReference = 2024) {
    if (montant2026 !== null && montant2026 !== undefined) {
        return { tarif: Number(montant2026), type: TYPE_CALCUL.CAMPAGNE_2026, anneeReference: 2026 };
    }
    if (reference !== null && reference !== undefined) {
        return {
            tarif: Number(reference),
            type: anneeReference === 2025 ? TYPE_CALCUL.REFERENCE_2025 : TYPE_CALCUL.REFERENCE_2024,
            anneeReference
        };
    }
    return { tarif: null, type: TYPE_CALCUL.NON_CALCULABLE, anneeReference: null };
}

function orientationValide(orientation) {
    return orientation && orientation.statut === STATUT_AIDE.A_EXAMINER;
}

function calculNonEligible(orientation) {
    return creerCalcul({
        id: orientation.id,
        nom: orientation.nom,
        type: TYPE_CALCUL.NON_CALCULABLE,
        avertissements: orientation.informationsManquantes.length
            ? orientation.informationsManquantes
            : orientation.verifications
    });
}

/* =========================================================
   PAIEMENTS DÉCOUPLÉS
========================================================= */

function calculerAideBase() {
    const orientation = analyserAideBase();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);

    const surface = nombreOuZero(profilExploitation.surfaces.surfaceAdmissible);
    const dpbActifs = nombreOuZero(profilExploitation.dpb.nombreDPBActives);
    const nombrePrime = Math.min(surface, dpbActifs);
    const totalDeclare = profilExploitation.dpb.valeurTotaleDPB;
    const moyenne = profilExploitation.dpb.valeurMoyenneDPB;

    if (estRenseigne(totalDeclare) && Number(totalDeclare) >= 0) {
        return creerCalcul({
            id: "aide_base",
            montant: Number(totalDeclare),
            type: TYPE_CALCUL.PROFIL_EXPLOITATION,
            formule: "Valeur totale des DPB renseignée par l'utilisateur",
            donnees: { nombreDPBActives: dpbActifs, surfaceAdmissible: surface }
        });
    }

    if (estRenseigne(moyenne) && Number(moyenne) >= 0) {
        return creerCalcul({
            id: "aide_base",
            montant: nombrePrime * Number(moyenne),
            type: TYPE_CALCUL.PROFIL_EXPLOITATION,
            formule: "min(DPB activés, surface admissible) × valeur moyenne des DPB renseignée",
            donnees: { nombrePrime, valeurMoyenneDPB: Number(moyenne) }
        });
    }

    return creerCalcul({
        id: "aide_base",
        type: TYPE_CALCUL.NON_CALCULABLE,
        avertissements: ["Renseignez la valeur moyenne ou la valeur totale réelle des DPB. La moyenne nationale de référence n'est pas utilisée comme substitut à la valeur de l'exploitation."]
    });
}

function calculerAideRedistributive() {
    const orientation = analyserAideRedistributive();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);

    const p = PARAMETRES_PAC_2026.aideRedistributive;
    const t = choisirTarif(p.montant2026, p.reference2024, 2024);
    const surface = Math.min(nombreOuZero(profilExploitation.surfaces.surfaceAdmissible), p.hectaresMaximum);
    if (t.tarif === null) return creerCalcul({ id: "aide_redistributive", avertissements: ["Montant unitaire non disponible."] });

    return creerCalcul({
        id: "aide_redistributive",
        montant: surface * t.tarif,
        type: t.type,
        anneeReference: t.anneeReference,
        formule: `min(surface admissible, ${p.hectaresMaximum} ha) × tarif`,
        donnees: { surface, tarif: t.tarif },
        avertissements: profilExploitation.general.gaecTotal ? ["Calcul présenté hors application détaillée de la transparence GAEC."] : []
    });
}

function calculerACJA() {
    const orientation = analyserACJA();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);

    const p = PARAMETRES_PAC_2026.ACJA;
    const t = choisirTarif(p.montant2026, p.reference2024, 2024);
    if (t.tarif === null) return creerCalcul({ id: "acja", avertissements: ["Forfait annuel non disponible."] });

    let multiplicateur = 1;
    if (profilExploitation.general.gaecTotal === true && nombreOuZero(profilExploitation.installation.nombreAssociesJAEligibles) > 0) {
        multiplicateur = nombreOuZero(profilExploitation.installation.nombreAssociesJAEligibles);
    }

    return creerCalcul({
        id: "acja",
        montant: t.tarif * multiplicateur,
        type: profilExploitation.general.gaecTotal && multiplicateur > 1 ? TYPE_CALCUL.PARTIEL : t.type,
        anneeReference: t.anneeReference,
        formule: "Forfait annuel × nombre de bénéficiaires JA pris en compte",
        donnees: { forfait: t.tarif, multiplicateur },
        avertissements: profilExploitation.general.gaecTotal ? ["La transparence GAEC et le nombre d'associés JA éligibles doivent être confirmés administrativement."] : []
    });
}

function calculerEcoregime() {
    const orientation = analyserEcoregime();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);

    const p = PARAMETRES_PAC_2026.ecoregime;
    const niveau = orientation.details.niveau;
    let t;
    if (niveau === "bio") t = choisirTarif(p.niveauBio2026, p.reference2024.niveauBio, 2024);
    else if (niveau === "superieur") t = choisirTarif(p.niveauSuperieur2026, p.reference2024.niveauSuperieur, 2024);
    else t = choisirTarif(p.niveauBase2026, p.reference2024.niveauBase, 2024);

    const surface = nombreOuZero(profilExploitation.surfaces.surfaceAdmissible);
    const avertissements = [];

    if (niveau === "base" && t.tarif === null) {
        avertissements.push("Le guide comporte deux montants 2024 différents pour le niveau de base (48,23 et 48,35 €/ha). Aucun n'est choisi automatiquement.");
        return creerCalcul({ id: "ecoregime", type: TYPE_CALCUL.NON_CALCULABLE, avertissements, details: orientation.details });
    }

    let montant = surface * t.tarif;
    let type = t.type;
    let anneeReference = t.anneeReference;

    if (orientation.details.bonusHaies) {
        const bonus = choisirTarif(p.bonusHaies2026, p.reference2024.bonusHaies, 2024);
        if (bonus.tarif !== null) {
            montant += surface * bonus.tarif;
            if (bonus.type !== type) type = TYPE_CALCUL.PARTIEL;
            avertissements.push(`Bonus haies ajouté avec la référence ${bonus.anneeReference}.`);
        } else {
            avertissements.push("Bonus haies identifié mais tarif annuel non disponible.");
        }
    }

    return creerCalcul({
        id: "ecoregime",
        montant,
        type,
        anneeReference,
        formule: "Surface admissible × tarif du niveau identifié, avec éventuel bonus haies",
        donnees: { surface, niveau, voie: orientation.details.voie, tarif: t.tarif },
        avertissements,
        details: orientation.details
    });
}

/* =========================================================
   AIDES COUPLÉES VÉGÉTALES
========================================================= */

function calculerAideSurface(id, orientation, surface, parametre) {
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    const t = choisirTarif(parametre.montant2026, parametre.reference2024, 2024);
    if (t.tarif === null) return creerCalcul({ id, avertissements: ["Tarif annuel non disponible."] });
    return creerCalcul({
        id,
        montant: nombreOuZero(surface) * t.tarif,
        type: t.type,
        anneeReference: t.anneeReference,
        formule: "Surface éligible × tarif unitaire",
        donnees: { surface: nombreOuZero(surface), tarif: t.tarif }
    });
}

function calculerLegumineusesGraines() {
    return calculerAideSurface(
        "legumineuses_graines",
        analyserLegumineusesGraines(),
        profilExploitation.productionsVegetales.legumineusesGraines.surface,
        PARAMETRES_PAC_2026.aidesCouplees.vegetales.legumineusesGraines
    );
}

function calculerLegumineusesFourrageres() {
    const orientation = analyserLegumineusesFourrageres();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    const zone = profilExploitation.productionsVegetales.legumineusesFourrageres.zone;
    const param = zone === "montagne"
        ? PARAMETRES_PAC_2026.aidesCouplees.vegetales.legumineusesFourrageres.montagne
        : PARAMETRES_PAC_2026.aidesCouplees.vegetales.legumineusesFourrageres.plainePiemont;
    return calculerAideSurface("legumineuses_fourrageres", orientation, profilExploitation.productionsVegetales.legumineusesFourrageres.surface, param);
}

function calculerBleDur() {
    return calculerAideSurface("ble_dur", analyserBleDur(), profilExploitation.productionsVegetales.bleDur.surface, PARAMETRES_PAC_2026.aidesCouplees.vegetales.bleDur);
}

function calculerPommeTerreFeculiere() {
    return calculerAideSurface("pomme_terre_feculiere", analyserPommeTerreFeculiere(), profilExploitation.productionsVegetales.pommeTerreFeculiere.surface, PARAMETRES_PAC_2026.aidesCouplees.vegetales.pommeTerreFeculiere);
}

function calculerRiz() {
    return calculerAideSurface("riz", analyserRiz(), profilExploitation.productionsVegetales.riz.surface, PARAMETRES_PAC_2026.aidesCouplees.vegetales.riz);
}

function calculerHoublon() {
    return calculerAideSurface("houblon", analyserHoublon(), profilExploitation.productionsVegetales.houblon.surface, PARAMETRES_PAC_2026.aidesCouplees.vegetales.houblon);
}

function calculerSemencesGraminees() {
    return calculerAideSurface("semences_graminees", analyserSemencesGraminees(), profilExploitation.productionsVegetales.semencesGraminees.surface, PARAMETRES_PAC_2026.aidesCouplees.vegetales.semencesGraminees);
}

function calculerChanvre() {
    return calculerAideSurface("chanvre", analyserChanvre(), profilExploitation.productionsVegetales.chanvre.surface, PARAMETRES_PAC_2026.aidesCouplees.vegetales.chanvre);
}

function calculerMaraichage() {
    return calculerAideSurface("petit_maraichage", analyserMaraichage(), calculerSurfaceMaraichage(), PARAMETRES_PAC_2026.aidesCouplees.vegetales.maraichage);
}

function calculerFruitsTransformes() {
    const orientation = analyserFruitsTransformes();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);

    const p = profilExploitation.productionsVegetales.fruitsTransformes;
    const tarifs = PARAMETRES_PAC_2026.aidesCouplees.vegetales.fruitsTransformes;
    const lignes = [
        ["pruneEnte", p.pruneEnte],
        ["ceriseBigarreau", p.ceriseBigarreau],
        ["poireWilliams", p.poireWilliams],
        ["pechePavie", p.pechePavie],
        ["tomateIndustrie", p.tomateIndustrie]
    ];

    let montant = 0;
    const details = {};
    let type = TYPE_CALCUL.REFERENCE_2024;
    lignes.forEach(([cle, surface]) => {
        const t = choisirTarif(tarifs[cle].montant2026, tarifs[cle].reference2024, 2024);
        const sousTotal = nombreOuZero(surface) * nombreOuZero(t.tarif);
        montant += sousTotal;
        details[cle] = { surface: nombreOuZero(surface), tarif: t.tarif, sousTotal: arrondirMontant(sousTotal) };
        if (t.type === TYPE_CALCUL.CAMPAGNE_2026) type = TYPE_CALCUL.PARTIEL;
    });

    return creerCalcul({ id: "fruits_transformes", montant, type, anneeReference: type === TYPE_CALCUL.REFERENCE_2024 ? 2024 : null, formule: "Somme des surfaces contractualisées × tarif de chaque production", details });
}

/* =========================================================
   AIDES COUPLÉES ANIMALES
========================================================= */

function calculerBovinsGenerique(id, orientation, param) {
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    const b = profilExploitation.bovins;
    const surfaceFourragere = nombreOuZero(profilExploitation.surfaces.surfaceFourragere);
    const plafondSurface = Math.max(40, 1.4 * surfaceFourragere);
    const plafondGlobal = Math.min(120, plafondSurface);
    const sup = Math.min(nombreOuZero(b.ugbNiveauSuperieur), plafondGlobal);
    const reste = Math.max(0, plafondGlobal - sup);
    const base = Math.min(nombreOuZero(b.ugbNiveauBase), 40, reste);
    const tSup = choisirTarif(param.superieur.montant2026, param.superieur.reference2024, 2024);
    const tBase = choisirTarif(param.base.montant2026, param.base.reference2024, 2024);

    const montant = sup * nombreOuZero(tSup.tarif) + base * nombreOuZero(tBase.tarif);
    return creerCalcul({
        id,
        montant,
        type: (tSup.type === tBase.type) ? tSup.type : TYPE_CALCUL.PARTIEL,
        anneeReference: tSup.anneeReference === tBase.anneeReference ? tSup.anneeReference : null,
        formule: "UGB niveau supérieur × tarif supérieur + UGB niveau de base × tarif de base, après plafonds simplifiés",
        donnees: { ugbSuperieurRetenues: sup, ugbBaseRetenues: base, plafondGlobal, surfaceFourragere },
        avertissements: ["Calcul indicatif : le classement précis des animaux et les plafonds doivent être vérifiés administrativement."]
    });
}

function calculerBovins() {
    return calculerBovinsGenerique("bovins_hexagone", analyserBovins(), PARAMETRES_PAC_2026.aidesCouplees.animales.bovinsHexagone);
}

function calculerBovinsCorse() {
    return calculerBovinsGenerique("bovins_corse", analyserBovinsCorse(), PARAMETRES_PAC_2026.aidesCouplees.animales.bovinsCorse);
}

function calculerVeauxQualite() {
    const orientation = analyserVeauxQualite();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    const p = PARAMETRES_PAC_2026.aidesCouplees.animales.veauxQualite;
    const t = choisirTarif(p.montant2026, p.reference2024, 2024);
    return creerCalcul({
        id: "veaux_qualite",
        montant: nombreOuZero(profilExploitation.veauxQualite.nombreVeauxEligibles) * t.tarif,
        type: t.type,
        anneeReference: t.anneeReference,
        formule: "Nombre de veaux éligibles × tarif par veau"
    });
}

function calculerOvins() {
    const orientation = analyserOvins();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    const o = profilExploitation.ovins;
    const p = PARAMETRES_PAC_2026.aidesCouplees.animales.ovinsHexagone;
    const baseTarif = choisirTarif(p.base.montant2026, p.base.reference2024, 2024);
    const majTarif = choisirTarif(p.majoration500Premieres.montant2026, p.majoration500Premieres.reference2024, 2024);
    const nouvTarif = choisirTarif(p.nouveauProducteur.montant2026, p.nouveauProducteur.reference2024, 2024);

    const demandees = nombreOuZero(o.nombreBrebis);
    let primees = demandees;
    if (o.nouveauProducteur !== true) {
        const presentesN1 = nombreOuZero(o.nombreBrebisPresentes1JanvierNMoins1);
        const agneaux = nombreOuZero(o.nombreAgneauxVendusNMoins1);
        const ratio = presentesN1 > 0 ? agneaux / presentesN1 : 0;
        if (ratio < 0.5 && presentesN1 > 0) primees = Math.min(demandees, agneaux / 0.5);
    }

    const majorables = Math.min(primees, 500);
    let montant = primees * baseTarif.tarif + majorables * majTarif.tarif;
    if (o.nouveauProducteur === true) montant += primees * nouvTarif.tarif;

    return creerCalcul({
        id: "ovins_hexagone",
        montant,
        type: TYPE_CALCUL.REFERENCE_2024,
        anneeReference: 2024,
        formule: "Brebis primables × base + majoration des 500 premières + éventuel complément nouveau producteur",
        donnees: { brebisDemandees: demandees, brebisPrimees: arrondirMontant(primees), brebisMajorees: arrondirMontant(majorables) },
        avertissements: ["Le guide ne précise pas ici les règles d'arrondi du nombre de brebis après réduction de productivité ; le résultat est indicatif.", ...(profilExploitation.general.gaecTotal ? ["Transparence GAEC à vérifier pour la majoration des 500 premières brebis."] : [])]
    });
}

function calculerCaprins() {
    const orientation = analyserCaprins();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    const p = PARAMETRES_PAC_2026.aidesCouplees.animales.caprinsHexagone;
    const t = choisirTarif(p.montant2026, p.reference2024, 2024);
    const nombreRetenu = Math.min(nombreOuZero(profilExploitation.caprins.nombreChevres), 400);
    return creerCalcul({
        id: "caprins_hexagone",
        montant: nombreRetenu * t.tarif,
        type: profilExploitation.general.gaecTotal ? TYPE_CALCUL.PARTIEL : t.type,
        anneeReference: t.anneeReference,
        formule: "min(chèvres éligibles, 400) × tarif",
        donnees: { chevresRetenues: nombreRetenu, tarif: t.tarif },
        avertissements: profilExploitation.general.gaecTotal ? ["La transparence GAEC peut modifier le plafond de 400 chèvres."] : []
    });
}

function calculerPetitsRuminantsCorse() {
    const orientation = analyserPetitsRuminantsCorse();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    const p = profilExploitation.petitsRuminantsCorse;
    const tarifs = PARAMETRES_PAC_2026.aidesCouplees.animales.petitsRuminantsCorse;
    const superieur = p.sousAOPBrocciu === true;

    const tarifBrebis = superieur ? tarifs.brebisSuperieur.reference2024 : tarifs.brebisBase.reference2024;
    const brebisMontant = nombreOuZero(p.nombreBrebis) * tarifBrebis;

    if (superieur && nombreOuZero(p.nombreChevres) > 0) {
        return creerCalcul({
            id: "petits_ruminants_corse",
            type: TYPE_CALCUL.PARTIEL,
            montant: brebisMontant,
            anneeReference: 2024,
            formule: "Part brebis calculée ; part chèvres niveau supérieur non utilisée automatiquement",
            avertissements: ["Le guide indique 34,85 €/chèvre mais l'intitule à nouveau « montant de base ». Cette valeur ambiguë n'est pas utilisée comme niveau supérieur automatique."]
        });
    }

    const tarifChevre = tarifs.chevreBase.reference2024;
    return creerCalcul({
        id: "petits_ruminants_corse",
        montant: brebisMontant + nombreOuZero(p.nombreChevres) * tarifChevre,
        type: TYPE_CALCUL.REFERENCE_2024,
        anneeReference: 2024,
        formule: "Brebis × tarif + chèvres × tarif",
        avertissements: ["Le plafond d'effectif fixé par arrêté n'est pas appliqué faute de valeur dans le guide national."]
    });
}

/* =========================================================
   ICHN
========================================================= */

function calculerICHNAnimale() {
    const orientation = analyserICHNAnimale();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    const i = profilExploitation.ichn;
    const p = PARAMETRES_PAC_2026.ICHN.animale;
    const surface = Math.min(nombreOuZero(i.surfacesFourrageresEligibles), p.surfaceMaximum);
    const partFixe = surface * p.montantBaseParHa;

    if (!estRenseigne(i.montantVariableSousZone) || !estRenseigne(i.coefficientModulationChargement)) {
        return creerCalcul({
            id: "ichn_animale",
            type: TYPE_CALCUL.NON_CALCULABLE,
            formule: "Part fixe + part variable locale, modulées selon le chargement",
            donnees: { surfaceRetenue: surface, partFixeTheorique: arrondirMontant(partFixe) },
            avertissements: [
                `Part fixe théorique avant modulation : ${formaterMontant(partFixe)}.`,
                "Le montant variable de sous-zone et le coefficient de chargement sont fixés localement ; le montant final n'est donc pas calculé."
            ]
        });
    }

    const tranche1 = Math.min(surface, 25);
    const tranche2 = Math.max(0, Math.min(surface, 50) - 25);
    const variable = tranche1 * Number(i.montantVariableSousZone) + tranche2 * Number(i.montantVariableSousZone) * p.coefficientDeuxiemeTranche;
    const montant = (partFixe + variable) * Number(i.coefficientModulationChargement);

    return creerCalcul({
        id: "ichn_animale",
        montant,
        type: TYPE_CALCUL.PARTIEL,
        formule: "(part fixe + part variable locale) × coefficient de modulation",
        donnees: { surface, partFixe, partVariable: variable, coefficient: Number(i.coefficientModulationChargement) },
        avertissements: ["Calcul à confirmer avec l'arrêté préfectoral applicable et les règles de revenu / chargement."]
    });
}

function calculerICHNVegetale() {
    const orientation = analyserICHNVegetale();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    const i = profilExploitation.ichn;
    const p = PARAMETRES_PAC_2026.ICHN.vegetale;
    if (i.zoneSeche === null) return creerCalcul({ id: "ichn_vegetale", avertissements: ["Précisez si les surfaces sont classées en zone sèche."] });

    const surface = Math.min(nombreOuZero(i.surfacesVegetalesEligibles), p.surfaceMaximum);
    const tarif = i.zoneSeche ? p.montantZoneSecheParHa : p.montantAutreZoneParHa;
    const t1 = Math.min(surface, p.premiereTranche);
    const t2 = Math.max(0, surface - p.premiereTranche);
    const montantAvantReduction = t1 * tarif + t2 * tarif * p.coefficientDeuxiemeTranche;

    if (nombreOuZero(i.pourcentageSAUZoneDefavorisee) < 80 || nombreOuZero(i.partRevenuAgricolePourcent) < 50) {
        return creerCalcul({
            id: "ichn_vegetale",
            type: TYPE_CALCUL.NON_CALCULABLE,
            donnees: { surface, tarif, montantAvantReduction: arrondirMontant(montantAvantReduction) },
            avertissements: [`Montant avant réduction éventuelle : ${formaterMontant(montantAvantReduction)}.`, "Le guide signale une réduction/plafonnement mais ne fournit pas ici le coefficient applicable à votre situation."]
        });
    }

    return creerCalcul({
        id: "ichn_vegetale",
        montant: montantAvantReduction,
        type: profilExploitation.general.gaecTotal ? TYPE_CALCUL.PARTIEL : TYPE_CALCUL.CAMPAGNE_2026,
        anneeReference: 2026,
        formule: "25 premiers ha au tarif plein + hectares 25 à 50 à 2/3 du tarif",
        donnees: { surface, tarif, zoneSeche: i.zoneSeche },
        avertissements: profilExploitation.general.gaecTotal ? ["La transparence GAEC doit être appliquée au plafond de surface."] : []
    });
}

/* =========================================================
   CAB / MAEC / AUTRES
========================================================= */

function calculerCAB() {
    const orientation = analyserCAB();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    const c = profilExploitation.conversionBio;
    const p = PARAMETRES_PAC_2026.CAB;
    const lignes = [
        ["landesEstivesParcours", c.landesEstivesParcours, p.landesEstivesParcours],
        ["prairiesAvecElevage", c.prairiesAvecElevage, p.prairiesAvecElevage],
        ["culturesAnnuellesLegumineusesJacheresSemences", c.culturesAnnuellesLegumineusesJacheresSemences, p.culturesAnnuellesLegumineusesJacheresSemences],
        ["viticulture", c.viticulture, p.viticulture],
        ["ppamListees", c.ppamListees, p.ppamListees],
        ["legumesPleinChampBetterave", c.legumesPleinChampBetterave, p.legumesPleinChampBetterave],
        ["maraichageArboricultureAutresPpamSemences", c.maraichageArboricultureAutresPpamSemences, p.maraichageArboricultureAutresPpamSemences]
    ];
    let montant = 0;
    const details = {};
    lignes.forEach(([cle, surface, tarif]) => {
        const sousTotal = nombreOuZero(surface) * tarif;
        montant += sousTotal;
        details[cle] = { surface: nombreOuZero(surface), tarif, sousTotal: arrondirMontant(sousTotal) };
    });

    return creerCalcul({
        id: "cab",
        montant,
        type: TYPE_CALCUL.PARTIEL,
        anneeReference: 2026,
        formule: "Somme des surfaces en conversion × montant national par catégorie de couvert",
        details,
        avertissements: ["Un plafond maximal d'aide par exploitation peut être fixé régionalement.", "Les jachères ne bénéficient que d'un seul paiement sur les 5 ans d'engagement ; les semences visées sont soumises à des conditions de contrat/convention."]
    });
}

function calculerMAEC() {
    const orientation = analyserMAEC();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    return creerCalcul({ id: "maec_surfaciques", type: TYPE_CALCUL.NON_CALCULABLE, avertissements: ["Les cahiers des charges et paramètres sont fixés localement ; aucun montant national unique n'est calculé."] });
}

function calculerAssuranceMRC() {
    const orientation = analyserAssuranceMRC();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    const prime = profilExploitation.assurance.primeAnnuelle;
    if (!estRenseigne(prime)) return creerCalcul({ id: "assurance_mrc", type: TYPE_CALCUL.NON_CALCULABLE, avertissements: ["Renseignez la prime annuelle pour obtenir une référence 2025.", "Le taux 2026 n'est pas fourni dans le guide."] });
    const taux = PARAMETRES_PAC_2026.assuranceMRC.reference2025;
    return creerCalcul({
        id: "assurance_mrc",
        montant: Number(prime) * taux,
        type: TYPE_CALCUL.REFERENCE_2025,
        anneeReference: 2025,
        formule: "Prime/cotisation × taux de prise en charge de référence 2025",
        donnees: { prime: Number(prime), taux },
        avertissements: ["Référence 2025 uniquement : le guide ne fournit pas le taux 2026."]
    });
}

function calculerSansMontant(id, orientation, message) {
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    return creerCalcul({ id, type: TYPE_CALCUL.NON_CALCULABLE, avertissements: [message] });
}

function calculerPredation() {
    return calculerSansMontant("predation", analyserPredation(), "Le montant dépend du cercle de prédation, du type de dépense, de la durée de pâturage, de l'effectif et du mode de conduite.");
}

function calculerProgrammesSectoriels() {
    return calculerSansMontant("programmes_sectoriels", analyserProgrammesSectoriels(), "Les aides sectorielles sont calculées dans le cadre des programmes approuvés ; le guide ne fournit pas de formule individuelle unique.");
}

function calculerAidesRegionales() {
    return calculerSansMontant("aides_regionales", analyserAidesRegionales(), "Les conditions et montants sont définis par la Région compétente.");
}

/* =========================================================
   CALCUL GLOBAL
========================================================= */

function calculerToutesLesAides() {
    return [
        calculerAideBase(),
        calculerEcoregime(),
        calculerAideRedistributive(),
        calculerACJA(),
        calculerLegumineusesGraines(),
        calculerLegumineusesFourrageres(),
        calculerBleDur(),
        calculerPommeTerreFeculiere(),
        calculerRiz(),
        calculerHoublon(),
        calculerSemencesGraminees(),
        calculerChanvre(),
        calculerMaraichage(),
        calculerFruitsTransformes(),
        calculerBovins(),
        calculerVeauxQualite(),
        calculerOvins(),
        calculerCaprins(),
        calculerBovinsCorse(),
        calculerPetitsRuminantsCorse(),
        calculerICHNAnimale(),
        calculerICHNVegetale(),
        calculerCAB(),
        calculerMAEC(),
        calculerAssuranceMRC(),
        calculerPredation(),
        calculerProgrammesSectoriels(),
        calculerAidesRegionales()
    ];
}

function calculerSyntheseFinanciere() {
    const calculs = calculerToutesLesAides().filter(c => c.montant !== null);
    const totaux = {
        campagne2026: 0,
        profilExploitation: 0,
        reference2024: 0,
        reference2025: 0,
        partiel: 0
    };

    calculs.forEach(c => {
        if (c.type === TYPE_CALCUL.CAMPAGNE_2026) totaux.campagne2026 += c.montant;
        else if (c.type === TYPE_CALCUL.PROFIL_EXPLOITATION) totaux.profilExploitation += c.montant;
        else if (c.type === TYPE_CALCUL.REFERENCE_2024) totaux.reference2024 += c.montant;
        else if (c.type === TYPE_CALCUL.REFERENCE_2025) totaux.reference2025 += c.montant;
        else if (c.type === TYPE_CALCUL.PARTIEL) totaux.partiel += c.montant;
    });

    Object.keys(totaux).forEach(cle => { totaux[cle] = arrondirMontant(totaux[cle]); });
    return totaux;
}
