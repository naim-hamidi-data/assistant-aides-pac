/* =========================================================
   MOTEUR D'ORIENTATION / ÉLIGIBILITÉ INITIALE — V2
========================================================= */

const STATUT_AIDE = {
    A_EXAMINER: "a_examiner",
    INFORMATIONS_MANQUANTES: "informations_manquantes",
    NON_RETENUE: "non_retenue"
};

function creerResultatAide(id, statut, raisons = [], informationsManquantes = [], verifications = [], details = {}) {
    const aide = obtenirAide(id);
    return {
        id,
        nom: aide ? aide.nom : id,
        categorie: aide ? aide.categorie : "",
        statut,
        raisons,
        informationsManquantes,
        verifications,
        details,
        source: aide ? aide.source : ""
    };
}

function nonRetenue(id, raison) {
    return creerResultatAide(id, STATUT_AIDE.NON_RETENUE, [], [], raison ? [raison] : []);
}

function verifierActifPourAide(id) {
    const actif = calculerAgriculteurActif();
    if (actif.statut === null) {
        return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], actif.manquants, actif.raisons);
    }
    if (actif.statut === false) {
        return nonRetenue(id, actif.raisons[0] || "Le critère d'agriculteur actif n'est pas rempli.");
    }
    return null;
}

function valeurPositive(v) {
    return nombreOuZero(v) > 0;
}

/* =========================================================
   PAIEMENTS DÉCOUPLÉS
========================================================= */

function analyserAideBase() {
    const id = "aide_base";
    const actif = verifierActifPourAide(id);
    if (actif) return actif;

    if (profilExploitation.dpb.detientDPB === false) return nonRetenue(id, "Aucun DPB n'est renseigné.");
    const manquants = [];
    if (profilExploitation.dpb.detientDPB === null) manquants.push("Détention de DPB");
    if (!estRenseigne(profilExploitation.dpb.nombreDPBActives)) manquants.push("Nombre de DPB activés");
    if (!estRenseigne(profilExploitation.surfaces.surfaceAdmissible)) manquants.push("Surface admissible");
    if (manquants.length) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], manquants);
    if (!aDesDPBActives() || nombreOuZero(profilExploitation.surfaces.surfaceAdmissible) <= 0) return nonRetenue(id, "Aucun DPB activé sur une surface admissible positive.");

    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Des DPB activés et une surface admissible sont renseignés."], [], ["La valeur réelle des DPB détermine le montant de l'aide de base."]);
}

function analyserAideRedistributive() {
    const id = "aide_redistributive";
    const actif = verifierActifPourAide(id);
    if (actif) return actif;
    if (!estRenseigne(profilExploitation.dpb.nombreDPBActives)) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Nombre de DPB activés"]);
    if (!aDesDPBActives()) return nonRetenue(id, "Au moins un DPB ou une fraction de DPB doit être activé.");
    if (!valeurPositive(profilExploitation.surfaces.surfaceAdmissible)) return nonRetenue(id, "Aucune surface admissible positive n'est renseignée.");
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Au moins un DPB est activé.", "Une surface admissible est renseignée."], [], profilExploitation.general.gaecTotal ? ["La transparence GAEC doit être appliquée."] : []);
}

function analyserACJA() {
    const id = "acja";
    const actif = verifierActifPourAide(id);
    if (actif) return actif;
    const ja = calculerQualificationJA();
    if (ja.manquants.length) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ja.manquants);
    if (!ja.eligible) return nonRetenue(id, ja.motif);
    if (!estRenseigne(profilExploitation.dpb.nombreDPBActives)) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["DPB activés"]);
    if (!aDesDPBActives()) return nonRetenue(id, "Au moins un DPB ou une fraction de DPB doit être activé.");
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, [ja.motif, "Au moins un DPB est activé."], [], profilExploitation.general.statutJuridique !== "individuel" ? ["Pour une société, confirmer administrativement l'associé qui confère le caractère JA."] : []);
}

function analyserEcoregime() {
    const id = "ecoregime";
    const actif = verifierActifPourAide(id);
    if (actif) return actif;

    if (!estRenseigne(profilExploitation.dpb.nombreDPBActives)) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Nombre de DPB activés"]);
    if (!aDesDPBActives()) return nonRetenue(id, "L'accès à l'écorégime nécessite des DPB activés.");
    if (!valeurPositive(profilExploitation.surfaces.surfaceAdmissible)) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Surface admissible"]);

    const diagnostic = calculerDiagnosticEcoregime();
    if (diagnostic.meilleureVoie) {
        const libelles = { pratiques: "pratiques", certification: "certification", biodiversite: "biodiversité" };
        const raisons = diagnostic.voiesEligibles.map(v => `Voie ${libelles[v.voie]} : niveau ${v.niveau}.`);
        if (diagnostic.bonusHaies.possible) raisons.push("Bonus haies potentiellement accessible par une voie compatible.");
        return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, raisons, [], [], {
            niveau: diagnostic.meilleureVoie.niveau,
            voie: diagnostic.meilleureVoie.voie,
            voiesEligibles: diagnostic.voiesEligibles,
            bonusHaies: diagnostic.bonusHaies,
            scoreDiversification: diagnostic.scoreDiversification,
            diagnosticComplet: diagnostic
        });
    }

    const manquants = [
        ...(diagnostic.voies.pratiques.manquants || []),
        ...(diagnostic.voies.certification.manquants || []),
        ...(diagnostic.voies.biodiversite.manquants || [])
    ];
    const uniques = [...new Set(manquants)];
    if (uniques.length) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], uniques, [], { diagnosticComplet: diagnostic });

    return nonRetenue(id, "Aucune des trois voies de l'écorégime n'atteint le niveau de base avec les données renseignées.");
}

/* =========================================================
   AIDES COUPLÉES VÉGÉTALES
========================================================= */

function analyserLegumineusesGraines() {
    const id = "legumineuses_graines";
    const p = profilExploitation.productionsVegetales.legumineusesGraines;
    if (!valeurPositive(p.surface)) return nonRetenue(id, "Aucune surface concernée n'est renseignée.");
    const actif = verifierActifPourAide(id); if (actif) return actif;
    const manquants = [];
    if (!p.destination) manquants.push("Destination des légumineuses");
    if (p.destination === "deshydratation") {
        if (p.contratDeshydratation === false) return nonRetenue(id, "La destination déshydratation nécessite un contrat avec une entreprise de déshydratation.");
        if (p.contratDeshydratation === null) manquants.push("Contrat de déshydratation");
    }
    if (estRenseigne(p.melangeProteagineuxPourcent) && nombreOuZero(p.melangeProteagineuxPourcent) <= 50) return nonRetenue(id, "Le mélange renseigné ne dépasse pas 50 % de protéagineux.");
    if (manquants.length) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], manquants);
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Une surface de production correspondante est renseignée."], [], ["Pour les mélanges céréales/protéagineux, vérifier que les protéagineux dépassent 50 % des semences implantées."]);
}

function analyserLegumineusesFourrageres() {
    const id = "legumineuses_fourrageres";
    const p = profilExploitation.productionsVegetales.legumineusesFourrageres;
    if (!valeurPositive(p.surface)) return nonRetenue(id, "Aucune surface de légumineuses fourragères n'est renseignée.");
    const actif = verifierActifPourAide(id); if (actif) return actif;
    const manquants = [];
    if (!p.zone) manquants.push("Zone plaine/piémont ou montagne");
    const ugb = calculerUGBTotalesDisponibles();
    if (ugb < 5 && p.contratEleveur5UGB === false) return nonRetenue(id, "Le seuil de 5 UGB n'est pas atteint et aucun contrat direct avec un éleveur détenant au moins 5 UGB n'est renseigné.");
    if (ugb < 5 && p.contratEleveur5UGB === null) manquants.push("Contrat direct avec un éleveur détenant au moins 5 UGB, ou UGB complémentaires");
    if (estRenseigne(p.melangeLegumineusesPourcent) && nombreOuZero(p.melangeLegumineusesPourcent) < 50) return nonRetenue(id, "Le mélange comporte moins de 50 % de légumineuses à l'implantation.");
    if (p.melangeAvecGraminees === true && p.anneeSemis === false) return nonRetenue(id, "Un mélange légumineuses/graminées n'est éligible que l'année du semis.");
    if (manquants.length) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], manquants);
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Surface de légumineuses fourragères renseignée.", `UGB disponibles calculées / renseignées : ${Math.round(ugb * 10) / 10}.`], [], [], { zone: p.zone, ugb });
}

function territoireBleDurEligible() {
    const region = normaliserTexte(profilExploitation.general.region);
    const dep = normaliserTexte(profilExploitation.general.departement);
    return region.includes("occitanie") || region.includes("provence-alpes-cote d'azur") || region.includes("paca") || dep.includes("drome") || dep.includes("ardeche");
}

function analyserBleDur() {
    const id = "ble_dur";
    const p = profilExploitation.productionsVegetales.bleDur;
    if (!valeurPositive(p.surface)) return nonRetenue(id, "Aucune surface de blé dur n'est renseignée.");
    const actif = verifierActifPourAide(id); if (actif) return actif;
    if (!profilExploitation.general.region && !profilExploitation.general.departement) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Région ou département"]);
    if (!territoireBleDurEligible()) return nonRetenue(id, "La localisation renseignée n'appartient pas aux zones indiquées comme éligibles dans le guide.");
    if (p.contratCollecteur === false) return nonRetenue(id, "Aucun contrat annuel de livraison avec un collecteur n'est renseigné.");
    if (p.contratCollecteur === null) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Contrat annuel avec un collecteur"]);
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Surface de blé dur en zone indiquée comme éligible.", "Contrat collecteur renseigné."]);
}

function analyserPommeTerreFeculiere() {
    const id = "pomme_terre_feculiere";
    const p = profilExploitation.productionsVegetales.pommeTerreFeculiere;
    if (!valeurPositive(p.surface)) return nonRetenue(id, "Aucune surface de pomme de terre féculière n'est renseignée.");
    const actif = verifierActifPourAide(id); if (actif) return actif;
    if (p.contratTransformation === false) return nonRetenue(id, "Le contrat requis n'est pas renseigné.");
    if (p.contratTransformation === null) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Contrat de culture / transformation"]);
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Surface et contrat renseignés."]);
}

function analyserRiz() {
    const id = "riz";
    if (!valeurPositive(profilExploitation.productionsVegetales.riz.surface)) return nonRetenue(id, "Aucune surface de riz n'est renseignée.");
    const actif = verifierActifPourAide(id); if (actif) return actif;
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Une surface de riz est renseignée."]);
}

function analyserHoublon() {
    const id = "houblon";
    if (!valeurPositive(profilExploitation.productionsVegetales.houblon.surface)) return nonRetenue(id, "Aucune surface de houblon n'est renseignée.");
    const actif = verifierActifPourAide(id); if (actif) return actif;
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Une surface de houblon est renseignée."]);
}

function analyserSemencesGraminees() {
    const id = "semences_graminees";
    const p = profilExploitation.productionsVegetales.semencesGraminees;
    if (!valeurPositive(p.surface)) return nonRetenue(id, "Aucune surface de semences de graminées n'est renseignée.");
    const actif = verifierActifPourAide(id); if (actif) return actif;
    const manquants = [];
    if (p.contratCulture === false) return nonRetenue(id, "Aucun contrat de culture n'est renseigné.");
    if (p.varieteAutorisee === false) return nonRetenue(id, "La variété n'est pas renseignée comme autorisée.");
    if (p.usageGazonUniquement === true) return nonRetenue(id, "Les productions destinées uniquement au gazon sont exclues.");
    if (p.contratCulture === null) manquants.push("Contrat de culture");
    if (p.varieteAutorisee === null) manquants.push("Variété autorisée");
    if (p.usageGazonUniquement === null) manquants.push("Destination de la semence");
    if (manquants.length) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], manquants);
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Surface, contrat et variété initialement compatibles."]);
}

function analyserChanvre() {
    const id = "chanvre";
    const p = profilExploitation.productionsVegetales.chanvre;
    if (!valeurPositive(p.surface)) return nonRetenue(id, "Aucune surface de chanvre n'est renseignée.");
    const actif = verifierActifPourAide(id); if (actif) return actif;
    const manquants = [];
    if (p.contratTransformationOuSemences === false) return nonRetenue(id, "Aucun contrat de transformation ou de semences certifiées n'est renseigné.");
    if (p.thcConforme === false) return nonRetenue(id, "La conformité réglementaire du chanvre n'est pas satisfaite.");
    if (p.contratTransformationOuSemences === null) manquants.push("Contrat transformation / semences");
    if (p.thcConforme === null) manquants.push("Conformité réglementaire du chanvre");
    if (manquants.length) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], manquants);
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Surface et conditions réglementaires initialement compatibles."]);
}

function analyserMaraichage() {
    const id = "petit_maraichage";
    const surface = calculerSurfaceMaraichage();
    if (surface <= 0) return nonRetenue(id, "Aucune surface de légumes frais ou petits fruits rouges n'est renseignée.");
    const actif = verifierActifPourAide(id); if (actif) return actif;
    if (!estRenseigne(profilExploitation.surfaces.sau)) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["SAU totale"]);
    if (surface < 0.5) return nonRetenue(id, "La surface concernée est inférieure à 0,5 ha.");
    if (nombreOuZero(profilExploitation.surfaces.sau) > 3) return nonRetenue(id, "La SAU renseignée dépasse 3 ha.");
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Au moins 0,5 ha de légumes frais / petits fruits rouges.", "SAU inférieure ou égale à 3 ha."]);
}

function analyserFruitsTransformes() {
    const id = "fruits_transformes";
    const p = profilExploitation.productionsVegetales.fruitsTransformes;
    if (sommeSurfacesFruitsTransformes() <= 0) return nonRetenue(id, "Aucune production destinée à la transformation n'est renseignée.");
    const actif = verifierActifPourAide(id); if (actif) return actif;
    if (p.deboucheIndustriel === false) return nonRetenue(id, "Le débouché industriel requis n'est pas renseigné.");
    if (p.deboucheIndustriel === null) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Adhésion à une OP reconnue ou contrat de transformation"]);
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Production correspondante et débouché industriel renseignés."]);
}

/* =========================================================
   AIDES COUPLÉES ANIMALES
========================================================= */

function analyserBovinsTerritoire(id, territoireAttendu) {
    if (profilExploitation.general.territoire !== territoireAttendu) return nonRetenue(id, `Cette variante concerne le territoire « ${territoireAttendu} ».`);
    const b = profilExploitation.bovins;
    const ugb = calculerUGBBovines();
    if (b.present === false || ugb.total <= 0) return nonRetenue(id, "Aucun atelier bovin éligible n'est renseigné.");
    const actif = verifierActifPourAide(id); if (actif) return actif;
    if (ugb.total < 5) return nonRetenue(id, "Le seuil de 5 UGB bovines n'est pas atteint.");
    const manquants = [];
    if (b.animauxDetenus6Mois === false) return nonRetenue(id, "La durée minimale de détention n'est pas respectée.");
    if (b.identificationConforme === false) return nonRetenue(id, "L'identification n'est pas renseignée comme conforme.");
    if (b.animauxDetenus6Mois === null) manquants.push("Détention des bovins pendant la durée requise");
    if (b.identificationConforme === null) manquants.push("Identification des bovins");
    if (!ugb.surfaceFourragereConnue) manquants.push("Surface fourragère pour appliquer le plafond lié à la surface");
    if (manquants.length) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], manquants, [], { ugb });
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, [`${Math.round(ugb.total * 10) / 10} UGB bovines calculées.`, "Durée de détention et identification renseignées comme conformes."], [], ["Le classement des UGB entre niveaux est calculé à partir des effectifs saisis ; il reste à confirmer administrativement."], { ugb });
}

function analyserBovins() { return analyserBovinsTerritoire("bovins_hexagone", "Hexagone"); }
function analyserBovinsCorse() { return analyserBovinsTerritoire("bovins_corse", "Corse"); }

function analyserVeauxQualite() {
    const id = "veaux_qualite";
    const v = profilExploitation.veauxQualite;
    if (!estHexagone()) return nonRetenue(id, "Cette aide est traitée ici pour l'Hexagone.");
    if (v.present === false || !valeurPositive(v.nombreVeauxEligibles)) return nonRetenue(id, "Aucun veau potentiellement éligible n'est renseigné.");
    const actif = verifierActifPourAide(id); if (actif) return actif;
    if (!(v.labelRouge === true || v.igpRoseePyreneesCatalanes === true || v.agricultureBiologique === true)) {
        if ([v.labelRouge, v.igpRoseePyreneesCatalanes, v.agricultureBiologique].every(x => x !== null)) return nonRetenue(id, "Aucun signe de qualité / mode biologique éligible n'est renseigné.");
        return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Label rouge, IGP Rosée des Pyrénées Catalanes ou agriculture biologique"]);
    }
    if (v.detention45Jours === false || v.identificationConforme === false) return nonRetenue(id, "Une condition de détention ou d'identification n'est pas respectée.");
    const manquants = [];
    if (v.detention45Jours === null) manquants.push("Détention d'au moins 45 jours");
    if (v.identificationConforme === null) manquants.push("Identification des veaux");
    if (manquants.length) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], manquants);
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Veaux et signe de qualité / bio renseignés."]);
}

function analyserOvins() {
    const id = "ovins_hexagone";
    const o = profilExploitation.ovins;
    if (!estHexagone()) return nonRetenue(id, "La variante Hexagone ne s'applique pas à la Corse.");
    if (o.present === false || !valeurPositive(o.nombreBrebis)) return nonRetenue(id, "Aucun atelier ovin n'est renseigné.");
    const actif = verifierActifPourAide(id); if (actif) return actif;
    if (nombreOuZero(o.nombreBrebis) < 50) return nonRetenue(id, "Le seuil de 50 brebis n'est pas atteint.");
    if (o.detention100Jours === false || o.identificationConforme === false) return nonRetenue(id, "Une condition de détention ou d'identification n'est pas respectée.");
    const manquants = [];
    if (o.detention100Jours === null) manquants.push("Détention pendant 100 jours");
    if (o.identificationConforme === null) manquants.push("Identification des ovins");
    if (o.nouveauProducteur !== true) {
        if (!estRenseigne(o.nombreBrebisPresentes1JanvierNMoins1)) manquants.push("Brebis présentes au 1er janvier N-1");
        if (!estRenseigne(o.nombreAgneauxVendusNMoins1)) manquants.push("Agneaux vendus en N-1");
    }
    if (manquants.length) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], manquants);
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Seuil de 50 brebis atteint.", "Détention et identification compatibles."], [], ["Le ratio de productivité sera appliqué au calcul sauf pour un nouveau producteur."]);
}

function analyserCaprins() {
    const id = "caprins_hexagone";
    const c = profilExploitation.caprins;
    if (!estHexagone()) return nonRetenue(id, "La variante Hexagone ne s'applique pas à la Corse.");
    if (c.present === false || !valeurPositive(c.nombreChevres)) return nonRetenue(id, "Aucun atelier caprin n'est renseigné.");
    const actif = verifierActifPourAide(id); if (actif) return actif;
    if (nombreOuZero(c.nombreChevres) < 25) return nonRetenue(id, "Le seuil de 25 chèvres n'est pas atteint.");
    if (c.detention100Jours === false || c.identificationConforme === false) return nonRetenue(id, "Une condition de détention ou d'identification n'est pas respectée.");
    const manquants = [];
    if (c.detention100Jours === null) manquants.push("Détention pendant 100 jours");
    if (c.identificationConforme === null) manquants.push("Identification des caprins");
    if (manquants.length) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], manquants);
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Seuil de 25 chèvres atteint.", "Détention et identification compatibles."], [], ["Le plafond de 400 chèvres et la transparence GAEC seront appliqués au calcul."]);
}

function analyserPetitsRuminantsCorse() {
    const id = "petits_ruminants_corse";
    if (!estCorse()) return nonRetenue(id, "Cette aide est spécifique à la Corse.");
    const brebis = nombreOuZero(profilExploitation.ovins.nombreBrebis);
    const chevres = nombreOuZero(profilExploitation.caprins.nombreChevres);
    const total = brebis + chevres;
    if (total <= 0) return nonRetenue(id, "Aucun petit ruminant n'est renseigné.");
    const actif = verifierActifPourAide(id); if (actif) return actif;
    const aop = profilExploitation.corse.sousAOPBrocciu;
    if (aop === null) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Engagement sous AOP Brocciu"]);
    const seuil = aop ? 90 : 50;
    if (total < seuil) return nonRetenue(id, `L'effectif total est inférieur au seuil de ${seuil} animaux.`);
    const detentionOk = (brebis <= 0 || profilExploitation.ovins.detention100Jours === true) && (chevres <= 0 || profilExploitation.caprins.detention100Jours === true);
    const idOk = (brebis <= 0 || profilExploitation.ovins.identificationConforme === true) && (chevres <= 0 || profilExploitation.caprins.identificationConforme === true);
    if (!detentionOk || !idOk) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Détention 100 jours et identification des animaux"]);
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Effectif minimal atteint.", "Détention et identification renseignées comme conformes."], [], ["Le plafond d'effectif est fixé par arrêté.", "La valeur 34,85 €/chèvre est libellée de façon ambiguë dans le guide et n'est pas utilisée automatiquement comme niveau supérieur."], { niveau: aop ? "superieur" : "base" });
}

/* =========================================================
   ICHN / CAB / MAEC
========================================================= */

function estZoneMontagneICHN() {
    return ["montagne", "haute_montagne"].includes(profilExploitation.ichn.typeZone);
}

function estZoneHorsMontagneICHN() {
    return ["piemont", "zone_defavorisee_simple"].includes(profilExploitation.ichn.typeZone);
}

function analyserICHNAnimale() {
    const id = "ichn_animale";
    const i = profilExploitation.ichn;
    if (i.zoneEligible === false) return nonRetenue(id, "Aucune surface en zone défavorisée ICHN n'est renseignée.");
    if (!valeurPositive(i.surfacesFourrageresEligibles) && calculerUGBTotalesDisponibles() <= 0) return nonRetenue(id, "Aucune situation ICHN animale n'est renseignée.");
    const actif = verifierActifPourAide(id); if (actif) return actif;
    const manquants = [];
    if (i.zoneEligible === null) manquants.push("Présence de surfaces en zone ICHN");
    if (!i.typeZone) manquants.push("Type de zone ICHN");
    if (!estRenseigne(i.surfacesFourrageresEligibles)) manquants.push("Surface fourragère en zone défavorisée");
    if (!estRenseigne(i.pourcentageSAUZoneDefavorisee)) manquants.push("Part de SAU en zone défavorisée");
    if (!estRenseigne(i.partRevenuAgricolePourcent)) manquants.push("Part du revenu agricole");
    const ugb = calculerUGBTotalesDisponibles();
    if (ugb < REFERENTIEL_PAC.ichn.animale.ugbMinimum && !estRenseigne(profilExploitation.autresAnimaux.ugbDeclareesHorsBovins)) manquants.push("UGB hors bovins si l'exploitation possède d'autres animaux");
    if (estZoneHorsMontagneICHN() && i.siegeEnZoneDefavorisee === null) manquants.push("Localisation du siège d'exploitation");
    if (manquants.length) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], manquants);
    if (nombreOuZero(i.surfacesFourrageresEligibles) < REFERENTIEL_PAC.ichn.animale.surfaceFourragereMinimum) return nonRetenue(id, "La surface fourragère en zone défavorisée est inférieure à 3 ha.");
    if (ugb < REFERENTIEL_PAC.ichn.animale.ugbMinimum) return nonRetenue(id, "Le seuil de 5 UGB n'est pas atteint.");
    if (estZoneHorsMontagneICHN() && i.siegeEnZoneDefavorisee === false) return nonRetenue(id, "Pour l'ICHN animale hors montagne, le siège doit être situé en zone défavorisée.");
    if (estZoneHorsMontagneICHN() && nombreOuZero(i.pourcentageSAUZoneDefavorisee) < 80) return nonRetenue(id, "Moins de 80 % de la SAU est en zone défavorisée : les surfaces hors montagne ne sont alors pas indemnisées selon le guide.");
    const verifications = ["Le montant variable et les plages de chargement sont fixés localement."];
    if (estZoneMontagneICHN() && nombreOuZero(i.pourcentageSAUZoneDefavorisee) < 80) verifications.push("En montagne, un paiement fortement réduit peut subsister lorsque moins de 80 % de la SAU est en zone défavorisée.");
    if (nombreOuZero(i.partRevenuAgricolePourcent) < 50) verifications.push("La part de revenu agricole est inférieure à 50 % : des plafonnements liés au revenu non agricole doivent être vérifiés.");
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Au moins 3 ha de surface fourragère en zone défavorisée.", `Au moins 5 UGB disponibles (${Math.round(ugb * 10) / 10} calculées / renseignées).`], [], verifications, { ugb });
}

function analyserICHNVegetale() {
    const id = "ichn_vegetale";
    const i = profilExploitation.ichn;
    if (i.zoneEligible === false) return nonRetenue(id, "Aucune zone ICHN n'est renseignée.");
    if (!valeurPositive(i.surfacesVegetalesEligibles)) return nonRetenue(id, "Aucune culture de vente en zone de montagne n'est renseignée.");
    const actif = verifierActifPourAide(id); if (actif) return actif;
    const manquants = [];
    if (!i.typeZone) manquants.push("Type de zone ICHN");
    if (!estRenseigne(i.pourcentageSAUZoneDefavorisee)) manquants.push("Part de SAU en zone défavorisée");
    if (!estRenseigne(i.partRevenuAgricolePourcent)) manquants.push("Part du revenu agricole");
    if (manquants.length) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], manquants);
    if (!estZoneMontagneICHN()) return nonRetenue(id, "L'ICHN végétale est réservée à la montagne / haute montagne.");
    if (nombreOuZero(i.surfacesVegetalesEligibles) < REFERENTIEL_PAC.ichn.vegetale.surfaceMinimum) return nonRetenue(id, "La surface de cultures de vente est inférieure à 1 ha.");
    const verifications = [];
    if (nombreOuZero(i.pourcentageSAUZoneDefavorisee) < 80) verifications.push("Le guide prévoit un taux fortement réduit en montagne lorsque moins de 80 % de la SAU est en zone défavorisée.");
    if (nombreOuZero(i.partRevenuAgricolePourcent) < 50) verifications.push("Des limitations liées au revenu non agricole doivent être vérifiées.");
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Zone de montagne / haute montagne renseignée.", "Au moins 1 ha de cultures de vente renseigné."], [], verifications);
}

function surfaceTotaleCAB() {
    const c = profilExploitation.conversionBio;
    return [c.landesEstivesParcours, c.prairiesAvecElevage, c.culturesAnnuellesLegumineusesJacheresSemences, c.viticulture, c.ppamListees, c.legumesPleinChampBetterave, c.maraichageArboricultureAutresPpamSemences]
        .reduce((t, v) => t + nombreOuZero(v), 0);
}

function analyserCAB() {
    const id = "cab";
    const c = profilExploitation.conversionBio;
    if (c.enConversion === false) return nonRetenue(id, "Aucune conversion biologique n'est renseignée.");
    if (c.enConversion === null && surfaceTotaleCAB() <= 0) return nonRetenue(id, "Aucune surface en conversion n'est renseignée.");
    const actif = verifierActifPourAide(id); if (actif) return actif;
    const manquants = [];
    if (c.enConversion === null) manquants.push("Engagement en conversion biologique");
    if (c.premiereOuDeuxiemeAnnee === null) manquants.push("Première ou deuxième année de conversion");
    if (c.premiereOuDeuxiemeAnnee === false) return nonRetenue(id, "Le guide indique que la CAB est accessible aux surfaces en première ou deuxième année de conversion.");
    if (surfaceTotaleCAB() <= 0) manquants.push("Surfaces en conversion par catégorie");
    if (manquants.length) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], manquants);
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Des surfaces en première / deuxième année de conversion sont renseignées."], [], ["Un plafond régional peut être fixé.", "L'engagement CAB est prévu pour 5 ans."]);
}

function analyserMAEC() {
    const id = "maec_surfaciques";
    const m = profilExploitation.maec;
    if (m.souhaiteExaminer !== true) return nonRetenue(id, "Aucune recherche de MAEC n'est demandée.");
    const actif = verifierActifPourAide(id); if (actif) return actif;
    if (m.offreLocaleConnue === null) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Existence d'une MAEC ouverte localement"]);
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, [m.offreLocaleConnue ? "Une offre MAEC locale est renseignée." : "Une recherche de MAEC est souhaitée."], [], ["Les MAEC disponibles, paramètres et montants dépendent de l'offre locale."]);
}

/* =========================================================
   RISQUES / PRÉDATION / SECTORIEL / RÉGIONAL
========================================================= */

function analyserAssuranceMRC() {
    const id = "assurance_mrc";
    const a = profilExploitation.assurance;
    if (a.souscritMRC === false) return nonRetenue(id, "Aucun contrat MRC n'est renseigné.");
    if (a.souscritMRC === null) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Souscription d'un contrat MRC"]);
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Un contrat MRC est renseigné."], [], ["Le guide donne un taux de prise en charge de 70 % en 2025 ; il est conservé comme référence, pas comme taux courant automatique."]);
}

function analyserPredation() {
    const id = "predation";
    const atelier = valeurPositive(profilExploitation.ovins.nombreBrebis) || valeurPositive(profilExploitation.caprins.nombreChevres);
    if (!atelier) return nonRetenue(id, "Aucun troupeau ovin ou caprin n'est renseigné.");
    if (profilExploitation.predation.zoneRisque === false) return nonRetenue(id, "La commune n'est pas renseignée dans un cercle de prédation.");
    if (profilExploitation.predation.zoneRisque === null) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Classement de la commune dans un cercle de prédation"]);
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Troupeau ovin/caprin et zone de risque renseignés."], [], ["Le niveau d'aide dépend du cercle, des dépenses, de la durée de pâturage, de l'effectif et du mode de conduite."]);
}

function analyserProgrammesSectoriels() {
    const id = "programmes_sectoriels";
    const secteurs = calculerSecteursPresents();
    if (!secteurs.length) return nonRetenue(id, "Aucun secteur correspondant aux programmes sectoriels du guide n'est détecté.");
    const secteursOP = ["fruits_legumes", "huile_olive", "proteines", "horticulture", "veau_label", "lapin", "riz"];
    const aBesoinOP = secteurs.some(s => secteursOP.includes(s));
    if (aBesoinOP && profilExploitation.programmesSectoriels.membreOPAOP === null) {
        return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Appartenance à une OP/AOP pour les secteurs concernés"], [], { secteurs });
    }
    const verifications = ["Les interventions et taux d'aide dépendent du programme et du bénéficiaire."];
    if (aBesoinOP && profilExploitation.programmesSectoriels.membreOPAOP === false) verifications.push("Pour les programmes opérationnels concernés, l'aide est versée aux OP/AOP ; l'exploitation peut néanmoins bénéficier d'actions comme membre d'une organisation.");
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, [`Secteur(s) détecté(s) : ${secteurs.join(", ")}.`], [], verifications, { secteurs });
}

function analyserAidesRegionales() {
    const id = "aides_regionales";
    const type = profilExploitation.regional.projetPrincipal;
    if (!type) return nonRetenue(id, "Aucun projet régional n'est renseigné.");
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Un projet relevant des interventions régionales du Feader est renseigné."], [], ["Les conditions et montants sont définis par la Région compétente."], { type });
}

/* =========================================================
   ANALYSE GLOBALE
========================================================= */

function analyserToutesLesAides() {
    return [
        analyserAideBase(), analyserEcoregime(), analyserAideRedistributive(), analyserACJA(),
        analyserLegumineusesGraines(), analyserLegumineusesFourrageres(), analyserBleDur(), analyserPommeTerreFeculiere(), analyserRiz(), analyserHoublon(), analyserSemencesGraminees(), analyserChanvre(), analyserMaraichage(), analyserFruitsTransformes(),
        analyserBovins(), analyserVeauxQualite(), analyserOvins(), analyserCaprins(), analyserBovinsCorse(), analyserPetitsRuminantsCorse(),
        analyserICHNAnimale(), analyserICHNVegetale(), analyserCAB(), analyserMAEC(), analyserAssuranceMRC(), analyserPredation(), analyserProgrammesSectoriels(), analyserAidesRegionales()
    ];
}

function aidesAExaminer() {
    return analyserToutesLesAides().filter(r => r.statut === STATUT_AIDE.A_EXAMINER);
}

function aidesInformationsManquantes() {
    return analyserToutesLesAides().filter(r => r.statut === STATUT_AIDE.INFORMATIONS_MANQUANTES);
}
