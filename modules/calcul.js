/* =========================================================
   MOTEUR DE CALCUL — V2

   Les références annuelles restent explicitement datées.
   L'interface, elle, reste générique (« Assistant PAC »).
========================================================= */

const TYPE_CALCUL = {
    DONNEE_EXPLOITATION: "donnee_exploitation",
    REFERENCE_2024: "reference_2024",
    REFERENCE_2025: "reference_2025",
    REGLE_GUIDE: "regle_guide",
    PARTIEL: "partiel",
    NON_CALCULABLE: "non_calculable"
};

function arrondirMontant(montant) {
    if (!Number.isFinite(Number(montant))) return null;
    return Math.round(Number(montant) * 100) / 100;
}

function formaterMontant(montant) {
    if (montant === null || montant === undefined || !Number.isFinite(Number(montant))) return "—";
    const locale = typeof simulatorLocale === "function" ? simulatorLocale() : "fr-FR";
    return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(Number(montant));
}

function creerCalcul({ id, nom = null, montant = null, type = TYPE_CALCUL.NON_CALCULABLE, anneeReference = null, formule = null, donnees = {}, avertissements = [], details = {} }) {
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

function orientationValide(orientation) {
    return orientation && orientation.statut === STATUT_AIDE.A_EXAMINER;
}

function calculNonEligible(orientation) {
    return creerCalcul({
        id: orientation.id,
        nom: orientation.nom,
        type: TYPE_CALCUL.NON_CALCULABLE,
        avertissements: orientation.informationsManquantes.length ? orientation.informationsManquantes : orientation.verifications
    });
}

function reference2024(tarif) {
    return { tarif, type: TYPE_CALCUL.REFERENCE_2024, anneeReference: 2024 };
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
    const total = profilExploitation.dpb.valeurTotaleDPB;
    const moyenne = profilExploitation.dpb.valeurMoyenneDPB;

    if (estRenseigne(total) && Number(total) >= 0) {
        return creerCalcul({ id: "aide_base", montant: Number(total), type: TYPE_CALCUL.DONNEE_EXPLOITATION, formule: "Valeur totale des DPB renseignée", donnees: { surface, dpbActifs } });
    }
    if (estRenseigne(moyenne) && Number(moyenne) >= 0) {
        return creerCalcul({ id: "aide_base", montant: nombrePrime * Number(moyenne), type: TYPE_CALCUL.DONNEE_EXPLOITATION, formule: "min(DPB activés, surface admissible) × valeur moyenne réelle des DPB", donnees: { nombrePrime, valeurMoyenne: Number(moyenne) } });
    }
    return creerCalcul({ id: "aide_base", avertissements: ["Renseignez la valeur moyenne ou la valeur totale réelle de vos DPB. La moyenne nationale n'est pas utilisée comme valeur de votre exploitation."] });
}

function calculerAideRedistributive() {
    const orientation = analyserAideRedistributive();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    const tarif = REFERENTIEL_PAC.montantsReference.redistributive2024;
    const maxHa = REFERENTIEL_PAC.montantsReference.hectaresRedistributiveMaximum;
    const surface = Math.min(nombreOuZero(profilExploitation.surfaces.surfaceAdmissible), maxHa);
    return creerCalcul({
        id: "aide_redistributive",
        montant: surface * tarif,
        type: TYPE_CALCUL.REFERENCE_2024,
        anneeReference: 2024,
        formule: `min(surface admissible, ${maxHa} ha) × référence 2024`,
        donnees: { surface, tarif },
        avertissements: ["Référence 2024 : le montant est recalculé annuellement.", ...(profilExploitation.general.gaecTotal ? ["Transparence GAEC à confirmer."] : [])]
    });
}

function calculerACJA() {
    const orientation = analyserACJA();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    const tarif = REFERENTIEL_PAC.montantsReference.acja2024;
    let multiplicateur = 1;
    if (profilExploitation.general.gaecTotal && nombreOuZero(profilExploitation.installation.nombreAssociesJAEligibles) > 0) multiplicateur = nombreOuZero(profilExploitation.installation.nombreAssociesJAEligibles);
    return creerCalcul({
        id: "acja",
        montant: tarif * multiplicateur,
        type: TYPE_CALCUL.REFERENCE_2024,
        anneeReference: 2024,
        formule: "Forfait de référence 2024 × nombre de bénéficiaires JA pris en compte",
        donnees: { tarif, multiplicateur },
        avertissements: ["Référence 2024 : le forfait annuel peut évoluer.", ...(profilExploitation.general.gaecTotal ? ["Nombre d'associés JA et transparence GAEC à confirmer."] : [])]
    });
}

function calculerEcoregime() {
    const orientation = analyserEcoregime();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    const details = orientation.details;
    const niveau = details.niveau;
    const ref = REFERENTIEL_PAC.montantsReference.ecoregime2024;
    let tarif = null;
    if (niveau === "bio") tarif = ref.niveauBio;
    else if (niveau === "superieur") tarif = ref.niveauSuperieur;
    else tarif = ref.niveauBase;

    if (niveau === "base" && tarif === null) {
        return creerCalcul({
            id: "ecoregime",
            type: TYPE_CALCUL.NON_CALCULABLE,
            details,
            avertissements: ["Le guide comporte deux valeurs 2024 différentes pour le niveau de base (48,23 et 48,35 €/ha). Aucune n'est choisie automatiquement."]
        });
    }

    const surface = nombreOuZero(profilExploitation.surfaces.surfaceAdmissible);
    let montant = surface * tarif;
    const avertissements = ["Montant calculé avec les références 2024 du guide, pas avec un taux courant automatique."];

    const voie = details.voie;
    if (details.bonusHaies && details.bonusHaies.possible) {
        if (["pratiques", "certification"].includes(voie)) {
            montant += surface * ref.bonusHaies;
            avertissements.push("Bonus haies ajouté avec la référence 2024.");
        } else {
            avertissements.push("Le bonus haies paraît possible via une voie pratiques/certification, mais il n'est pas ajouté car la meilleure voie détectée est la biodiversité.");
        }
    }

    return creerCalcul({
        id: "ecoregime",
        montant,
        type: TYPE_CALCUL.REFERENCE_2024,
        anneeReference: 2024,
        formule: "Surface admissible × référence du niveau détecté, avec éventuel bonus haies",
        donnees: { surface, niveau, voie, tarif, pointsDiversification: details.scoreDiversification?.points },
        avertissements,
        details
    });
}

/* =========================================================
   AIDES COUPLÉES VÉGÉTALES
========================================================= */

function calculerAideSurfaceReference(id, orientation, surface, tarif) {
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    return creerCalcul({ id, montant: nombreOuZero(surface) * tarif, type: TYPE_CALCUL.REFERENCE_2024, anneeReference: 2024, formule: "Surface éligible × référence 2024", donnees: { surface: nombreOuZero(surface), tarif }, avertissements: ["Référence 2024 : le montant annuel peut évoluer."] });
}

function calculerLegumineusesGraines() {
    return calculerAideSurfaceReference("legumineuses_graines", analyserLegumineusesGraines(), profilExploitation.productionsVegetales.legumineusesGraines.surface, REFERENTIEL_PAC.montantsReference.aidesCouplees2024.legumineusesGraines);
}

function calculerLegumineusesFourrageres() {
    const orientation = analyserLegumineusesFourrageres();
    const p = profilExploitation.productionsVegetales.legumineusesFourrageres;
    const tarif = p.zone === "montagne" ? REFERENTIEL_PAC.montantsReference.aidesCouplees2024.legumineusesFourrageresMontagne : REFERENTIEL_PAC.montantsReference.aidesCouplees2024.legumineusesFourrageresPlainePiemont;
    return calculerAideSurfaceReference("legumineuses_fourrageres", orientation, p.surface, tarif);
}

function calculerBleDur() { return calculerAideSurfaceReference("ble_dur", analyserBleDur(), profilExploitation.productionsVegetales.bleDur.surface, REFERENTIEL_PAC.montantsReference.aidesCouplees2024.bleDur); }
function calculerPommeTerreFeculiere() { return calculerAideSurfaceReference("pomme_terre_feculiere", analyserPommeTerreFeculiere(), profilExploitation.productionsVegetales.pommeTerreFeculiere.surface, REFERENTIEL_PAC.montantsReference.aidesCouplees2024.pommeTerreFeculiere); }
function calculerRiz() { return calculerAideSurfaceReference("riz", analyserRiz(), profilExploitation.productionsVegetales.riz.surface, REFERENTIEL_PAC.montantsReference.aidesCouplees2024.riz); }
function calculerHoublon() { return calculerAideSurfaceReference("houblon", analyserHoublon(), profilExploitation.productionsVegetales.houblon.surface, REFERENTIEL_PAC.montantsReference.aidesCouplees2024.houblon); }
function calculerSemencesGraminees() { return calculerAideSurfaceReference("semences_graminees", analyserSemencesGraminees(), profilExploitation.productionsVegetales.semencesGraminees.surface, REFERENTIEL_PAC.montantsReference.aidesCouplees2024.semencesGraminees); }
function calculerChanvre() { return calculerAideSurfaceReference("chanvre", analyserChanvre(), profilExploitation.productionsVegetales.chanvre.surface, REFERENTIEL_PAC.montantsReference.aidesCouplees2024.chanvre); }
function calculerMaraichage() { return calculerAideSurfaceReference("petit_maraichage", analyserMaraichage(), calculerSurfaceMaraichage(), REFERENTIEL_PAC.montantsReference.aidesCouplees2024.petitMaraichage); }

function calculerFruitsTransformes() {
    const orientation = analyserFruitsTransformes();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    const f = profilExploitation.productionsVegetales.fruitsTransformes;
    const t = REFERENTIEL_PAC.montantsReference.aidesCouplees2024;
    const lignes = [
        ["Prune d'Ente", f.pruneEnte, t.pruneEnte],
        ["Cerise Bigarreau", f.ceriseBigarreau, t.ceriseBigarreau],
        ["Poire Williams", f.poireWilliams, t.poireWilliams],
        ["Pêche Pavie", f.pechePavie, t.pechePavie],
        ["Tomate industrie", f.tomateIndustrie, t.tomateIndustrie]
    ];
    const details = {};
    let montant = 0;
    lignes.forEach(([nom, surface, tarif]) => {
        const sousTotal = nombreOuZero(surface) * tarif;
        montant += sousTotal;
        details[nom] = { surface: nombreOuZero(surface), tarif, sousTotal: arrondirMontant(sousTotal) };
    });
    return creerCalcul({ id: "fruits_transformes", montant, type: TYPE_CALCUL.REFERENCE_2024, anneeReference: 2024, formule: "Somme des surfaces × références 2024 par production", details, avertissements: ["Références 2024 : les montants annuels peuvent évoluer."] });
}

/* =========================================================
   AIDES COUPLÉES ANIMALES
========================================================= */

function calculerBovinsGenerique(id, orientation, tarifBase, tarifSup) {
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    const u = calculerUGBBovines();
    const montant = u.niveauSuperieurRetenu * tarifSup + u.niveauBaseRetenu * tarifBase;
    return creerCalcul({
        id,
        montant,
        type: TYPE_CALCUL.REFERENCE_2024,
        anneeReference: 2024,
        formule: "UGB calculées niveau supérieur × tarif + UGB niveau de base × tarif, après plafonds simplifiés",
        donnees: u,
        avertissements: ["Calcul indicatif à partir des effectifs saisis. Le classement précis des animaux et l'application administrative des plafonds doivent être confirmés."]
    });
}

function calculerBovins() {
    const t = REFERENTIEL_PAC.montantsReference.aidesCouplees2024;
    return calculerBovinsGenerique("bovins_hexagone", analyserBovins(), t.bovinsHexagoneBase, t.bovinsHexagoneSuperieur);
}

function calculerBovinsCorse() {
    const t = REFERENTIEL_PAC.montantsReference.aidesCouplees2024;
    return calculerBovinsGenerique("bovins_corse", analyserBovinsCorse(), t.bovinsCorseBase, t.bovinsCorseSuperieur);
}

function calculerVeauxQualite() {
    const orientation = analyserVeauxQualite();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    const tarif = REFERENTIEL_PAC.montantsReference.aidesCouplees2024.veauxQualite;
    return creerCalcul({ id: "veaux_qualite", montant: nombreOuZero(profilExploitation.veauxQualite.nombreVeauxEligibles) * tarif, type: TYPE_CALCUL.REFERENCE_2024, anneeReference: 2024, formule: "Veaux éligibles × référence 2024", avertissements: ["Référence 2024."] });
}

function calculerOvins() {
    const orientation = analyserOvins();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    const o = profilExploitation.ovins;
    const t = REFERENTIEL_PAC.montantsReference.aidesCouplees2024;
    const demandees = nombreOuZero(o.nombreBrebis);
    let primees = demandees;
    if (o.nouveauProducteur !== true) {
        const presentes = nombreOuZero(o.nombreBrebisPresentes1JanvierNMoins1);
        const agneaux = nombreOuZero(o.nombreAgneauxVendusNMoins1);
        const ratioProductivite = presentes > 0 ? agneaux / presentes : 0;
        if (ratioProductivite < 0.5 && presentes > 0) primees = Math.min(demandees, agneaux / 0.5);
    }
    const majorables = Math.min(primees, 500);
    let montant = primees * t.ovinsBase + majorables * t.ovinsMajoration500;
    if (o.nouveauProducteur === true) montant += primees * t.ovinsNouveauProducteur;
    return creerCalcul({ id: "ovins_hexagone", montant, type: TYPE_CALCUL.REFERENCE_2024, anneeReference: 2024, formule: "Brebis primables × base + majoration 500 premières + éventuel nouveau producteur", donnees: { brebisDemandees: demandees, brebisPrimees: arrondirMontant(primees), majorables: arrondirMontant(majorables) }, avertissements: ["Références 2024. Le guide ne précise pas ici la règle d'arrondi du nombre de brebis après réduction de productivité.", ...(profilExploitation.general.gaecTotal ? ["Transparence GAEC à confirmer pour la majoration."] : [])] });
}

function calculerCaprins() {
    const orientation = analyserCaprins();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    const tarif = REFERENTIEL_PAC.montantsReference.aidesCouplees2024.caprins;
    const retenues = Math.min(nombreOuZero(profilExploitation.caprins.nombreChevres), 400);
    return creerCalcul({ id: "caprins_hexagone", montant: retenues * tarif, type: TYPE_CALCUL.REFERENCE_2024, anneeReference: 2024, formule: "min(chèvres, 400) × référence 2024", donnees: { retenues, tarif }, avertissements: ["Référence 2024.", ...(profilExploitation.general.gaecTotal ? ["La transparence GAEC peut modifier le plafond."] : [])] });
}

function calculerPetitsRuminantsCorse() {
    const orientation = analyserPetitsRuminantsCorse();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    const brebis = nombreOuZero(profilExploitation.ovins.nombreBrebis);
    const chevres = nombreOuZero(profilExploitation.caprins.nombreChevres);
    const aop = profilExploitation.corse.sousAOPBrocciu === true;
    const t = REFERENTIEL_PAC.montantsReference.aidesCouplees2024;
    const montantBrebis = brebis * (aop ? t.brebisCorseSuperieur : t.brebisCorseBase);
    if (aop && chevres > 0) {
        return creerCalcul({ id: "petits_ruminants_corse", montant: montantBrebis, type: TYPE_CALCUL.PARTIEL, anneeReference: 2024, formule: "Part brebis calculée ; part chèvres niveau supérieur non automatisée", avertissements: ["Le guide affiche 34,85 €/chèvre mais l'intitule à nouveau « montant de base ». Cette valeur ambiguë n'est pas utilisée comme niveau supérieur."] });
    }
    return creerCalcul({ id: "petits_ruminants_corse", montant: montantBrebis + chevres * t.chevreCorseBase, type: TYPE_CALCUL.REFERENCE_2024, anneeReference: 2024, formule: "Brebis × tarif + chèvres × tarif", avertissements: ["Références 2024. Le plafond d'effectif fixé par arrêté n'est pas appliqué faute de valeur nationale dans le guide."] });
}

/* =========================================================
   ICHN
========================================================= */

function calculerICHNAnimale() {
    const orientation = analyserICHNAnimale();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    const i = profilExploitation.ichn;
    const p = REFERENTIEL_PAC.ichn.animale;
    const surface = Math.min(nombreOuZero(i.surfacesFourrageresEligibles), p.surfaceMaximum);
    const partFixe = surface * p.montantBaseParHa;
    if (!estRenseigne(i.montantVariableSousZone) || !estRenseigne(i.coefficientModulationChargement)) {
        return creerCalcul({ id: "ichn_animale", type: TYPE_CALCUL.NON_CALCULABLE, formule: "Part fixe + part variable locale, modulées selon le chargement", donnees: { surface, partFixeTheorique: arrondirMontant(partFixe) }, avertissements: [`Part fixe théorique avant modulation : ${formaterMontant(partFixe)}.`, "Le montant variable de sous-zone et le coefficient de chargement sont fixés localement."] });
    }
    const tranche1 = Math.min(surface, p.trancheVariablePleine);
    const tranche2 = Math.max(0, Math.min(surface, p.trancheVariableReduiteFin) - p.trancheVariablePleine);
    const variable = tranche1 * Number(i.montantVariableSousZone) + tranche2 * Number(i.montantVariableSousZone) * p.coefficientDeuxiemeTranche;
    const montant = (partFixe + variable) * Number(i.coefficientModulationChargement);
    return creerCalcul({ id: "ichn_animale", montant, type: TYPE_CALCUL.PARTIEL, formule: "(part fixe + part variable locale) × coefficient de chargement", donnees: { surface, partFixe, partVariable: variable, coefficient: Number(i.coefficientModulationChargement) }, avertissements: ["À confirmer avec l'arrêté préfectoral et les règles locales de chargement / revenu."] });
}

function calculerICHNVegetale() {
    const orientation = analyserICHNVegetale();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    const i = profilExploitation.ichn;
    const p = REFERENTIEL_PAC.ichn.vegetale;
    if (i.zoneSeche === null) return creerCalcul({ id: "ichn_vegetale", avertissements: ["Précisez si les surfaces sont classées en zone sèche."] });
    const surface = Math.min(nombreOuZero(i.surfacesVegetalesEligibles), p.surfaceMaximum);
    const tarif = i.zoneSeche ? p.zoneSecheParHa : p.autreZoneParHa;
    const t1 = Math.min(surface, p.premiereTranche);
    const t2 = Math.max(0, surface - p.premiereTranche);
    const montantAvantReduction = t1 * tarif + t2 * tarif * p.coefficientDeuxiemeTranche;
    if (nombreOuZero(i.pourcentageSAUZoneDefavorisee) < 80 || nombreOuZero(i.partRevenuAgricolePourcent) < 50) {
        return creerCalcul({ id: "ichn_vegetale", type: TYPE_CALCUL.NON_CALCULABLE, donnees: { surface, tarif, montantAvantReduction: arrondirMontant(montantAvantReduction) }, avertissements: [`Montant avant réduction éventuelle : ${formaterMontant(montantAvantReduction)}.`, "Le guide signale une réduction / un plafonnement sans fournir ici le coefficient applicable à votre situation."] });
    }
    return creerCalcul({ id: "ichn_vegetale", montant: montantAvantReduction, type: TYPE_CALCUL.REGLE_GUIDE, formule: "25 premiers ha au tarif plein + tranche 25-50 ha à 2/3", donnees: { surface, tarif, zoneSeche: i.zoneSeche }, avertissements: profilExploitation.general.gaecTotal ? ["Transparence GAEC à appliquer au plafond de surface."] : [] });
}

/* =========================================================
   CAB / MAEC / AUTRES
========================================================= */

function calculerCAB() {
    const orientation = analyserCAB();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    const c = profilExploitation.conversionBio;
    const t = REFERENTIEL_PAC.cab.tarifs;
    const lignes = [
        ["landesEstivesParcours", c.landesEstivesParcours, t.landesEstivesParcours],
        ["prairiesAvecElevage", c.prairiesAvecElevage, t.prairiesAvecElevage],
        ["culturesAnnuellesLegumineusesJacheresSemences", c.culturesAnnuellesLegumineusesJacheresSemences, t.culturesAnnuellesLegumineusesJacheresSemences],
        ["viticulture", c.viticulture, t.viticulture],
        ["ppamListees", c.ppamListees, t.ppamListees],
        ["legumesPleinChampBetterave", c.legumesPleinChampBetterave, t.legumesPleinChampBetterave],
        ["maraichageArboricultureAutresPpamSemences", c.maraichageArboricultureAutresPpamSemences, t.maraichageArboricultureAutresPpamSemences]
    ];
    let montant = 0;
    const details = {};
    lignes.forEach(([cle, surface, tarif]) => {
        const sousTotal = nombreOuZero(surface) * tarif;
        montant += sousTotal;
        details[cle] = { surface: nombreOuZero(surface), tarif, sousTotal: arrondirMontant(sousTotal) };
    });
    return creerCalcul({ id: "cab", montant, type: TYPE_CALCUL.REGLE_GUIDE, formule: "Somme des surfaces en conversion × tarif national par catégorie", details, avertissements: ["Un plafond maximal d'aide peut être fixé au niveau régional.", "Les jachères ne bénéficient que d'un seul paiement sur les 5 ans ; certaines semences sont soumises à un contrat / convention."] });
}

function calculerMAEC() {
    const orientation = analyserMAEC();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    return creerCalcul({ id: "maec_surfaciques", type: TYPE_CALCUL.NON_CALCULABLE, avertissements: ["Les cahiers des charges, paramètres et montants sont fixés localement."] });
}

function calculerAssuranceMRC() {
    const orientation = analyserAssuranceMRC();
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    if (!estRenseigne(profilExploitation.assurance.primeAnnuelle)) return creerCalcul({ id: "assurance_mrc", type: TYPE_CALCUL.NON_CALCULABLE, avertissements: ["Renseignez la prime annuelle pour obtenir une référence 2025."] });
    const taux = REFERENTIEL_PAC.montantsReference.assuranceMRC2025;
    return creerCalcul({ id: "assurance_mrc", montant: Number(profilExploitation.assurance.primeAnnuelle) * taux, type: TYPE_CALCUL.REFERENCE_2025, anneeReference: 2025, formule: "Prime × taux de prise en charge de référence 2025", donnees: { prime: Number(profilExploitation.assurance.primeAnnuelle), taux }, avertissements: ["Référence 2025 uniquement ; elle n'est pas présentée comme taux courant."] });
}

function calculerSansMontant(id, orientation, message) {
    if (!orientationValide(orientation)) return calculNonEligible(orientation);
    return creerCalcul({ id, type: TYPE_CALCUL.NON_CALCULABLE, avertissements: [message] });
}

function calculerPredation() { return calculerSansMontant("predation", analyserPredation(), "Le montant dépend du cercle de prédation, des dépenses, de la durée de pâturage, de l'effectif et du mode de conduite."); }
function calculerProgrammesSectoriels() { return calculerSansMontant("programmes_sectoriels", analyserProgrammesSectoriels(), "Le montant dépend du programme approuvé, de l'OP/AOP ou du bénéficiaire et des dépenses éligibles."); }
function calculerAidesRegionales() { return calculerSansMontant("aides_regionales", analyserAidesRegionales(), "Les conditions et montants sont définis par la Région compétente."); }

/* =========================================================
   CALCUL GLOBAL
========================================================= */

function calculerToutesLesAides() {
    return [
        calculerAideBase(), calculerEcoregime(), calculerAideRedistributive(), calculerACJA(),
        calculerLegumineusesGraines(), calculerLegumineusesFourrageres(), calculerBleDur(), calculerPommeTerreFeculiere(), calculerRiz(), calculerHoublon(), calculerSemencesGraminees(), calculerChanvre(), calculerMaraichage(), calculerFruitsTransformes(),
        calculerBovins(), calculerVeauxQualite(), calculerOvins(), calculerCaprins(), calculerBovinsCorse(), calculerPetitsRuminantsCorse(),
        calculerICHNAnimale(), calculerICHNVegetale(), calculerCAB(), calculerMAEC(), calculerAssuranceMRC(), calculerPredation(), calculerProgrammesSectoriels(), calculerAidesRegionales()
    ];
}

function calculerSyntheseFinanciere() {
    const totaux = { donneeExploitation: 0, reference2024: 0, reference2025: 0, regleGuide: 0, partiel: 0 };
    calculerToutesLesAides().forEach(c => {
        if (c.montant === null) return;
        if (c.type === TYPE_CALCUL.DONNEE_EXPLOITATION) totaux.donneeExploitation += c.montant;
        else if (c.type === TYPE_CALCUL.REFERENCE_2024) totaux.reference2024 += c.montant;
        else if (c.type === TYPE_CALCUL.REFERENCE_2025) totaux.reference2025 += c.montant;
        else if (c.type === TYPE_CALCUL.REGLE_GUIDE) totaux.regleGuide += c.montant;
        else if (c.type === TYPE_CALCUL.PARTIEL) totaux.partiel += c.montant;
    });
    Object.keys(totaux).forEach(cle => { totaux[cle] = arrondirMontant(totaux[cle]); });
    return totaux;
}
