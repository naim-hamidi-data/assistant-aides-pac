/* =========================================================
   MOTEUR D'ORIENTATION / ÉLIGIBILITÉ INITIALE

   IMPORTANT : le résultat n'est jamais une décision
   administrative d'éligibilité. Il s'agit d'une orientation
   à partir des informations saisies et du guide PAC utilisé.
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

function verifierAgriculteurActif() {
    const statut = profilExploitation.agriculteurActif.statut;
    if (statut === true) return { valide: true, inconnu: false };
    if (statut === false) return { valide: false, inconnu: false };
    return { valide: false, inconnu: true };
}

function verifierActifPourAide(id) {
    const actif = verifierAgriculteurActif();
    if (actif.inconnu) {
        return creerResultatAide(
            id,
            STATUT_AIDE.INFORMATIONS_MANQUANTES,
            [],
            ["Statut d'agriculteur actif"]
        );
    }
    if (!actif.valide) return nonRetenue(id, "Le critère d'agriculteur actif n'est pas rempli.");
    return null;
}

function valeurPositive(valeur) {
    return nombreOuZero(valeur) > 0;
}

function niveauScore(niveau) {
    return { base: 1, superieur: 2, bio: 3 }[niveau] || 0;
}

/* =========================================================
   PAIEMENTS DÉCOUPLÉS
========================================================= */

function analyserAideBase() {
    const id = "aide_base";
    const actif = verifierActifPourAide(id);
    if (actif) return actif;

    if (profilExploitation.dpb.detientDPB === false) {
        return nonRetenue(id, "Aucun DPB n'est renseigné.");
    }

    const manquants = [];
    if (profilExploitation.dpb.detientDPB === null) manquants.push("Détention de DPB");
    if (!estRenseigne(profilExploitation.dpb.nombreDPBActives)) manquants.push("Nombre de DPB activés");
    if (!estRenseigne(profilExploitation.surfaces.surfaceAdmissible)) manquants.push("Surface admissible");

    if (manquants.length) {
        return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], manquants);
    }

    if (!aDesDPBActives() || nombreOuZero(profilExploitation.surfaces.surfaceAdmissible) <= 0) {
        return nonRetenue(id, "Aucun DPB ne peut être activé sur une surface admissible positive.");
    }

    return creerResultatAide(
        id,
        STATUT_AIDE.A_EXAMINER,
        ["Des DPB activés et une surface admissible sont renseignés."],
        [],
        ["La valeur réelle des DPB de l'exploitation reste déterminante pour le montant."]
    );
}

function analyserAideRedistributive() {
    const id = "aide_redistributive";
    const actif = verifierActifPourAide(id);
    if (actif) return actif;

    if (!estRenseigne(profilExploitation.dpb.nombreDPBActives)) {
        return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Nombre de DPB activés"]);
    }
    if (!aDesDPBActives()) return nonRetenue(id, "Au moins un DPB ou une fraction de DPB doit être activé.");
    if (!valeurPositive(profilExploitation.surfaces.surfaceAdmissible)) {
        return nonRetenue(id, "Aucune surface admissible positive n'est renseignée.");
    }

    return creerResultatAide(
        id,
        STATUT_AIDE.A_EXAMINER,
        ["Au moins un DPB est activé.", "Une surface admissible est renseignée."],
        [],
        profilExploitation.general.gaecTotal ? ["La transparence GAEC doit être appliquée."] : []
    );
}

function verifierQualificationJA() {
    const i = profilExploitation.installation;
    const exp = nombreOuZero(i.experienceAgricoleMois);

    if (i.diplomeAgricoleNiveau4OuPlus === true) return { valide: true, inconnu: false };
    if (exp >= 40) return { valide: true, inconnu: false };
    if (i.diplomeNiveau3OuPlus === true && exp >= 24) return { valide: true, inconnu: false };

    const informationsSuffisantes =
        i.diplomeAgricoleNiveau4OuPlus !== null &&
        i.diplomeNiveau3OuPlus !== null &&
        estRenseigne(i.experienceAgricoleMois);

    return { valide: false, inconnu: !informationsSuffisantes };
}

function analyserACJA() {
    const id = "acja";
    const actif = verifierActifPourAide(id);
    if (actif) return actif;

    const i = profilExploitation.installation;
    const manquants = [];

    if (i.premiereInstallation === false) return nonRetenue(id, "La demande ne concerne pas une première installation récente.");
    if (i.premiereInstallation === null) manquants.push("Première installation");
    if (!estRenseigne(i.age)) manquants.push("Âge");
    if (!estRenseigne(i.anneeInstallation)) manquants.push("Année de première installation");
    if (!estRenseigne(profilExploitation.dpb.nombreDPBActives)) manquants.push("DPB activés");

    const qualification = verifierQualificationJA();
    if (qualification.inconnu) manquants.push("Diplôme / expérience agricole");

    if (manquants.length) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], manquants);

    if (nombreOuZero(i.age) > 40) return nonRetenue(id, "L'âge renseigné dépasse 40 ans.");
    if (nombreOuZero(i.anneeInstallation) < 2021 || nombreOuZero(i.anneeInstallation) > 2026) {
        return nonRetenue(id, "La première installation renseignée n'est pas située dans la période de cinq années civiles précédant 2026 ou en 2026.");
    }
    if (!qualification.valide) return nonRetenue(id, "Les conditions de diplôme ou d'expérience renseignées ne permettent pas d'identifier la qualification JA.");
    if (!aDesDPBActives()) return nonRetenue(id, "Au moins un DPB ou une fraction de DPB doit être activé.");

    const verifications = [];
    if (profilExploitation.general.statutJuridique && profilExploitation.general.statutJuridique !== "individuel") {
        verifications.push("Pour une société, vérifier que l'associé conférant le caractère JA respecte bien les critères applicables.");
    }

    return creerResultatAide(
        id,
        STATUT_AIDE.A_EXAMINER,
        ["Première installation récente.", "Condition d'âge renseignée comme respectée.", "Qualification JA initialement compatible.", "Au moins un DPB est activé."],
        [],
        verifications
    );
}

/* =========================================================
   ÉCORÉGIME
========================================================= */

function categorieSignificative(surfaceCategorie, surfaceAdmissible) {
    const total = nombreOuZero(surfaceAdmissible);
    if (total <= 0) return false;
    return nombreOuZero(surfaceCategorie) / total >= 0.05;
}

function evaluerVoiePratiques() {
    const s = profilExploitation.surfaces;
    const e = profilExploitation.ecoregime;
    const manquants = [];
    const niveaux = [];
    let auMoinsUneCategorie = false;

    if (!valeurPositive(s.surfaceAdmissible)) return { eligible: false, manquants: ["Surface admissible"] };

    if (categorieSignificative(s.terresArables, s.surfaceAdmissible)) {
        auMoinsUneCategorie = true;
        if (!estRenseigne(e.pointsDiversification)) manquants.push("Points de diversification des cultures");
        else if (nombreOuZero(e.pointsDiversification) < 4) return { eligible: false, manquants: [], motif: "La diversification des cultures n'atteint pas 4 points." };
        else niveaux.push(nombreOuZero(e.pointsDiversification) >= 5 ? "superieur" : "base");
    }

    if (categorieSignificative(s.prairiesPermanentes, s.surfaceAdmissible)) {
        auMoinsUneCategorie = true;
        if (!estRenseigne(e.pourcentagePrairiesNonLabourees)) manquants.push("Pourcentage de prairies permanentes non labourées");
        else if (nombreOuZero(e.pourcentagePrairiesNonLabourees) < 80) return { eligible: false, manquants: [], motif: "Le taux de prairies permanentes non labourées est inférieur à 80 %." };
        else niveaux.push(nombreOuZero(e.pourcentagePrairiesNonLabourees) >= 90 ? "superieur" : "base");
    }

    if (categorieSignificative(s.culturesPermanentes, s.surfaceAdmissible)) {
        auMoinsUneCategorie = true;
        if (!estRenseigne(e.pourcentageInterRangsCouverts)) manquants.push("Pourcentage d'inter-rangs couverts");
        else if (nombreOuZero(e.pourcentageInterRangsCouverts) < 75) return { eligible: false, manquants: [], motif: "La couverture des inter-rangs est inférieure à 75 %." };
        else niveaux.push(nombreOuZero(e.pourcentageInterRangsCouverts) >= 95 ? "superieur" : "base");
    }

    if (manquants.length) return { eligible: false, manquants };
    if (!auMoinsUneCategorie) return { eligible: false, manquants: [], motif: "Aucune catégorie de surface significative n'est renseignée pour évaluer cette voie." };

    const niveau = niveaux.every(n => n === "superieur") ? "superieur" : "base";
    return { eligible: true, niveau, manquants: [] };
}

function evaluerVoieCertification() {
    const env = profilExploitation.environnement;
    if (env.agricultureBiologique === true) return { eligible: true, niveau: "bio" };
    if (env.hveRenovee === true) return { eligible: true, niveau: "superieur" };
    if (env.certificationCE2Plus === true) return { eligible: true, niveau: "base" };

    const inconnu = [env.agricultureBiologique, env.hveRenovee, env.certificationCE2Plus].some(v => v === null);
    return { eligible: false, manquants: inconnu ? ["Certifications AB / HVE rénovée / CE2+"] : [] };
}

function evaluerVoieBiodiversite() {
    const ratio = profilExploitation.ecoregime.pourcentageIAEEtJacheresSAU;
    if (!estRenseigne(ratio)) return { eligible: false, manquants: ["Pourcentage d'IAE et jachères dans la SAU"] };
    if (nombreOuZero(ratio) >= 10) return { eligible: true, niveau: "superieur" };
    if (nombreOuZero(ratio) >= 7) return { eligible: true, niveau: "base" };
    return { eligible: false, manquants: [] };
}

function analyserEcoregime() {
    const id = "ecoregime";
    const actif = verifierActifPourAide(id);
    if (actif) return actif;

    if (!estRenseigne(profilExploitation.dpb.nombreDPBActives)) {
        return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["DPB activés"]);
    }
    if (!aDesDPBActives()) return nonRetenue(id, "L'accès à l'écorégime suppose de disposer de DPB activables.");
    if (!valeurPositive(profilExploitation.surfaces.surfaceAdmissible)) return nonRetenue(id, "Aucune surface admissible positive n'est renseignée.");

    const voies = [
        { id: "pratiques", ...evaluerVoiePratiques() },
        { id: "certification", ...evaluerVoieCertification() },
        { id: "biodiversite", ...evaluerVoieBiodiversite() }
    ];

    const eligibles = voies.filter(v => v.eligible);
    if (!eligibles.length) {
        const manquants = [...new Set(voies.flatMap(v => v.manquants || []))];
        if (manquants.length) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], manquants);
        return nonRetenue(id, "Aucune des trois voies d'accès ne semble atteindre le niveau de base avec les informations saisies.");
    }

    eligibles.sort((a, b) => niveauScore(b.niveau) - niveauScore(a.niveau));
    const meilleure = eligibles[0];

    const s = profilExploitation.surfaces;
    const env = profilExploitation.environnement;
    const taSignificatives = categorieSignificative(s.terresArables, s.surfaceAdmissible);
    const voieCompatibleHaies = eligibles.some(v => v.id === "pratiques" || v.id === "certification");
    const bonusHaies =
        voieCompatibleHaies &&
        nombreOuZero(s.pourcentageHaiesSAU) >= 6 &&
        (!taSignificatives || nombreOuZero(s.pourcentageHaiesTerresArables) >= 6) &&
        env.certificationGestionDurableHaies === true &&
        env.maecEntretienLigneux !== true;

    const raisons = [
        `Voie(s) initialement compatible(s) : ${eligibles.map(v => v.id).join(", ")}.`,
        `Niveau le plus élevé identifié : ${meilleure.niveau}.`
    ];
    if (bonusHaies) raisons.push("Les informations saisies sont compatibles avec le bonus haies.");

    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, raisons, [], [], {
        niveau: meilleure.niveau,
        voie: meilleure.id,
        voiesEligibles: eligibles.map(v => ({ voie: v.id, niveau: v.niveau })),
        bonusHaies
    });
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
    if (estRenseigne(p.melangeProteagineuxPourcent) && nombreOuZero(p.melangeProteagineuxPourcent) <= 50) {
        return nonRetenue(id, "Le mélange renseigné ne dépasse pas 50 % de protéagineux.");
    }
    if (manquants.length) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], manquants);

    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Une surface de production éligible est renseignée."], [], ["Si la parcelle est un mélange céréales/protéagineux, vérifier que la part de protéagineux dépasse 50 % des semences implantées."]);
}

function analyserLegumineusesFourrageres() {
    const id = "legumineuses_fourrageres";
    const p = profilExploitation.productionsVegetales.legumineusesFourrageres;
    if (!valeurPositive(p.surface)) return nonRetenue(id, "Aucune surface de légumineuses fourragères n'est renseignée.");
    const actif = verifierActifPourAide(id); if (actif) return actif;

    const manquants = [];
    if (!p.zone) manquants.push("Zone plaine/piémont ou montagne");
    const ugb = nombreOuZero(p.ugb);
    if (ugb < 5 && p.contratEleveur5UGB === false) return nonRetenue(id, "Le seuil de 5 UGB n'est pas atteint et aucun contrat avec un éleveur détenant au moins 5 UGB n'est renseigné.");
    if (ugb < 5 && p.contratEleveur5UGB === null) manquants.push("UGB ou contrat direct avec un éleveur détenant au moins 5 UGB");
    if (estRenseigne(p.melangeLegumineusesPourcent) && nombreOuZero(p.melangeLegumineusesPourcent) < 50) {
        return nonRetenue(id, "Le mélange comporte moins de 50 % de légumineuses à l'implantation.");
    }
    if (p.melangeAvecGraminees === true && p.anneeSemis === false) {
        return nonRetenue(id, "Un mélange légumineuses/graminées n'est éligible que l'année du semis.");
    }
    if (manquants.length) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], manquants);

    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Surface de légumineuses fourragères renseignée.", "Condition UGB/contrat initialement compatible."], [], [], { zone: p.zone });
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

    if (!profilExploitation.general.region && !profilExploitation.general.departement) {
        return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Région ou département"]);
    }
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
    if (p.contratTransformation === false) return nonRetenue(id, "Le contrat de culture requis n'est pas renseigné.");
    if (p.contratTransformation === null) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Contrat de culture / transformation"]);
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Surface et contrat de culture renseignés."]);
}

function analyserRiz() {
    const id = "riz";
    const p = profilExploitation.productionsVegetales.riz;
    if (!valeurPositive(p.surface)) return nonRetenue(id, "Aucune surface de riz n'est renseignée.");
    const actif = verifierActifPourAide(id); if (actif) return actif;
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Une surface implantée en riz est renseignée."]);
}

function analyserHoublon() {
    const id = "houblon";
    const p = profilExploitation.productionsVegetales.houblon;
    if (!valeurPositive(p.surface)) return nonRetenue(id, "Aucune surface de houblon n'est renseignée.");
    const actif = verifierActifPourAide(id); if (actif) return actif;
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Une surface implantée en houblon est renseignée."]);
}

function analyserSemencesGraminees() {
    const id = "semences_graminees";
    const p = profilExploitation.productionsVegetales.semencesGraminees;
    if (!valeurPositive(p.surface)) return nonRetenue(id, "Aucune surface de semences de graminées n'est renseignée.");
    const actif = verifierActifPourAide(id); if (actif) return actif;

    const manquants = [];
    if (p.contratCulture === false) return nonRetenue(id, "Aucun contrat de culture n'est renseigné.");
    if (p.varieteAutorisee === false) return nonRetenue(id, "La variété renseignée n'est pas indiquée comme autorisée.");
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
    if (p.contratTransformationOuSemences === false) return nonRetenue(id, "Aucun contrat de transformation ou de production de semences certifiées n'est renseigné.");
    if (p.thcConforme === false) return nonRetenue(id, "La conformité réglementaire du chanvre n'est pas remplie.");
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
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Au moins 0,5 ha de légumes frais ou petits fruits rouges.", "SAU inférieure ou égale à 3 ha."]);
}

function analyserFruitsTransformes() {
    const id = "fruits_transformes";
    const p = profilExploitation.productionsVegetales.fruitsTransformes;
    if (sommeSurfacesFruitsTransformes() <= 0) return nonRetenue(id, "Aucune production destinée à la transformation n'est renseignée.");
    const actif = verifierActifPourAide(id); if (actif) return actif;
    if (p.deboucheIndustriel === false) return nonRetenue(id, "Le débouché industriel requis n'est pas renseigné.");
    if (p.deboucheIndustriel === null) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Adhésion à une OP reconnue ou contrat avec une usine de transformation"]);
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Une production éligible et un débouché industriel sont renseignés."]);
}

/* =========================================================
   AIDES COUPLÉES ANIMALES
========================================================= */

function ugbBovinesRenseignees() {
    const b = profilExploitation.bovins;
    if (estRenseigne(b.ugbTotal)) return nombreOuZero(b.ugbTotal);
    return nombreOuZero(b.ugbNiveauSuperieur) + nombreOuZero(b.ugbNiveauBase);
}

function analyserBovinsTerritoire(id, territoireAttendu) {
    if (profilExploitation.general.territoire !== territoireAttendu) {
        return nonRetenue(id, `Cette variante concerne le territoire « ${territoireAttendu} ».`);
    }
    const b = profilExploitation.bovins;
    if (b.present === false && ugbBovinesRenseignees() <= 0) return nonRetenue(id, "Aucun atelier bovin n'est renseigné.");
    const actif = verifierActifPourAide(id); if (actif) return actif;

    const manquants = [];
    if (ugbBovinesRenseignees() < 5) return nonRetenue(id, "Le seuil de 5 UGB bovines n'est pas atteint.");
    if (b.animauxDetenus6Mois === false) return nonRetenue(id, "La durée minimale de détention renseignée n'est pas respectée.");
    if (b.identificationConforme === false) return nonRetenue(id, "Les conditions d'identification ne sont pas renseignées comme conformes.");
    if (b.animauxDetenus6Mois === null) manquants.push("Durée de détention des bovins");
    if (b.identificationConforme === null) manquants.push("Identification des bovins");
    if (!estRenseigne(b.ugbNiveauSuperieur) || !estRenseigne(b.ugbNiveauBase)) manquants.push("Répartition des UGB entre niveau supérieur et niveau de base");
    if (manquants.length) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], manquants);

    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Le seuil de 5 UGB est atteint.", "Durée de détention et identification renseignées comme conformes."], [], ["Le classement précis des UGB entre niveaux et les plafonds doivent être vérifiés sur le dossier." ]);
}

function analyserBovins() {
    return analyserBovinsTerritoire("bovins_hexagone", "Hexagone");
}

function analyserBovinsCorse() {
    return analyserBovinsTerritoire("bovins_corse", "Corse");
}

function analyserVeauxQualite() {
    const id = "veaux_qualite";
    const v = profilExploitation.veauxQualite;
    if (!estHexagone()) return nonRetenue(id, "Cette aide est traitée ici pour l'Hexagone.");
    if (v.present === false || !valeurPositive(v.nombreVeauxEligibles)) return nonRetenue(id, "Aucun veau potentiellement éligible n'est renseigné.");
    const actif = verifierActifPourAide(id); if (actif) return actif;

    if (!(v.labelRouge === true || v.igpRoseePyreneesCatalanes === true || v.agricultureBiologique === true)) {
        const toutRenseigne = [v.labelRouge, v.igpRoseePyreneesCatalanes, v.agricultureBiologique].every(x => x !== null);
        if (toutRenseigne) return nonRetenue(id, "Aucun signe de qualité ou mode biologique éligible n'est renseigné.");
        return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Label rouge, IGP Rosée des Pyrénées Catalanes ou agriculture biologique"]);
    }
    if (v.detention45Jours === false || v.identificationConforme === false) return nonRetenue(id, "Une condition de détention ou d'identification n'est pas respectée.");

    const manquants = [];
    if (v.detention45Jours === null) manquants.push("Détention d'au moins 45 jours");
    if (v.identificationConforme === null) manquants.push("Identification des veaux");
    if (manquants.length) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], manquants);

    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Veaux potentiellement éligibles et signe de qualité / bio renseignés."]);
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

    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Le seuil de 50 brebis est atteint.", "Détention et identification renseignées comme conformes."], [], ["Le ratio de productivité sera appliqué au calcul sauf pour un nouveau producteur."]);
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

    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Le seuil de 25 chèvres est atteint.", "Détention et identification renseignées comme conformes."], [], ["Le plafond de 400 chèvres et la transparence GAEC seront appliqués au calcul."]);
}

function analyserPetitsRuminantsCorse() {
    const id = "petits_ruminants_corse";
    if (!estCorse()) return nonRetenue(id, "Cette aide est spécifique à la Corse.");
    const p = profilExploitation.petitsRuminantsCorse;
    const total = nombreOuZero(p.nombreBrebis) + nombreOuZero(p.nombreChevres);
    if (total <= 0) return nonRetenue(id, "Aucun petit ruminant n'est renseigné.");
    const actif = verifierActifPourAide(id); if (actif) return actif;

    const seuil = p.sousAOPBrocciu === true ? 90 : 50;
    if (total < seuil) return nonRetenue(id, `L'effectif total renseigné est inférieur au seuil de ${seuil} animaux associé au niveau demandé.`);
    if (p.detention100Jours === false || p.identificationConforme === false) return nonRetenue(id, "Une condition de détention ou d'identification n'est pas respectée.");

    const manquants = [];
    if (p.sousAOPBrocciu === null) manquants.push("Engagement sous AOP Brocciu");
    if (p.detention100Jours === null) manquants.push("Détention pendant 100 jours");
    if (p.identificationConforme === null) manquants.push("Identification des animaux");
    if (manquants.length) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], manquants);

    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Effectif minimal atteint.", "Détention et identification renseignées comme conformes."], [], ["Le plafond d'effectif est fixé par arrêté et doit être vérifié.", "La valeur 2024 de 34,85 €/chèvre est libellée de façon ambiguë dans le guide ; elle n'est pas utilisée automatiquement comme niveau supérieur."], { niveau: p.sousAOPBrocciu ? "superieur" : "base" });
}

/* =========================================================
   ICHN
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
    if (i.zoneEligible === false || i.aideAnimale === false) return nonRetenue(id, "Aucune surface fourragère en zone ICHN n'est renseignée.");
    if (i.zoneEligible === null && i.aideAnimale !== true) return nonRetenue(id, "Aucune demande ICHN animale n'est renseignée.");
    const actif = verifierActifPourAide(id); if (actif) return actif;

    const manquants = [];
    if (!i.typeZone) manquants.push("Type de zone ICHN");
    if (!estRenseigne(i.surfacesFourrageresEligibles)) manquants.push("Surface fourragère en zone défavorisée");
    if (!estRenseigne(i.ugb)) manquants.push("UGB ICHN");
    if (!estRenseigne(i.pourcentageSAUZoneDefavorisee)) manquants.push("Part de SAU en zone défavorisée");
    if (!estRenseigne(i.partRevenuAgricolePourcent)) manquants.push("Part du revenu agricole");
    if (estZoneHorsMontagneICHN() && i.siegeEnZoneDefavorisee === null) manquants.push("Siège d'exploitation en zone défavorisée");
    if (manquants.length) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], manquants);

    if (nombreOuZero(i.surfacesFourrageresEligibles) < 3) return nonRetenue(id, "La surface fourragère en zone défavorisée est inférieure à 3 ha.");
    if (nombreOuZero(i.ugb) < 5) return nonRetenue(id, "Le seuil de 5 UGB n'est pas atteint.");
    if (estZoneHorsMontagneICHN() && i.siegeEnZoneDefavorisee === false) return nonRetenue(id, "Hors montagne, le siège doit être situé en zone défavorisée.");
    if (estZoneHorsMontagneICHN() && nombreOuZero(i.pourcentageSAUZoneDefavorisee) < 80) return nonRetenue(id, "Moins de 80 % de la SAU est en zone défavorisée ; le guide indique que les surfaces hors montagne ne sont alors pas indemnisées.");

    const verifications = [];
    if (estZoneMontagneICHN() && nombreOuZero(i.pourcentageSAUZoneDefavorisee) < 80) verifications.push("En montagne, un paiement fortement réduit peut rester possible lorsque moins de 80 % de la SAU est en zone défavorisée.");
    if (nombreOuZero(i.partRevenuAgricolePourcent) < 50) verifications.push("La part de revenu agricole est inférieure à 50 % : des plafonnements liés au revenu non agricole doivent être vérifiés.");
    verifications.push("Le montant variable et les plages de chargement sont fixés localement.");

    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Au moins 3 ha de surface fourragère en zone défavorisée.", "Au moins 5 UGB renseignées."], [], verifications);
}

function analyserICHNVegetale() {
    const id = "ichn_vegetale";
    const i = profilExploitation.ichn;
    if (i.zoneEligible === false || i.aideVegetale === false) return nonRetenue(id, "Aucune culture de vente en zone de montagne n'est renseignée.");
    if (i.zoneEligible === null && i.aideVegetale !== true) return nonRetenue(id, "Aucune demande ICHN végétale n'est renseignée.");
    const actif = verifierActifPourAide(id); if (actif) return actif;

    const manquants = [];
    if (!i.typeZone) manquants.push("Type de zone ICHN");
    if (!estRenseigne(i.surfacesVegetalesEligibles)) manquants.push("Surface de cultures de vente en montagne");
    if (!estRenseigne(i.pourcentageSAUZoneDefavorisee)) manquants.push("Part de SAU en zone défavorisée");
    if (!estRenseigne(i.partRevenuAgricolePourcent)) manquants.push("Part du revenu agricole");
    if (manquants.length) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], manquants);

    if (!estZoneMontagneICHN()) return nonRetenue(id, "L'ICHN végétale est réservée aux zones de montagne et haute montagne.");
    if (nombreOuZero(i.surfacesVegetalesEligibles) < 1) return nonRetenue(id, "La surface de cultures de vente est inférieure à 1 ha.");

    const verifications = [];
    if (nombreOuZero(i.pourcentageSAUZoneDefavorisee) < 80) verifications.push("Le guide prévoit un taux fortement réduit en montagne lorsque moins de 80 % de la SAU est en zone défavorisée.");
    if (nombreOuZero(i.partRevenuAgricolePourcent) < 50) verifications.push("Des limitations liées au revenu non agricole doivent être vérifiées.");

    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Zone de montagne ou haute montagne renseignée.", "Au moins 1 ha de cultures de vente renseigné."], [], verifications);
}

/* =========================================================
   CAB / MAEC
========================================================= */

function surfaceTotaleCAB() {
    const c = profilExploitation.conversionBio;
    return [
        c.landesEstivesParcours,
        c.prairiesAvecElevage,
        c.culturesAnnuellesLegumineusesJacheresSemences,
        c.viticulture,
        c.ppamListees,
        c.legumesPleinChampBetterave,
        c.maraichageArboricultureAutresPpamSemences
    ].reduce((total, valeur) => total + nombreOuZero(valeur), 0);
}

function analyserCAB() {
    const id = "cab";
    const c = profilExploitation.conversionBio;
    if (c.enConversion === false) return nonRetenue(id, "Aucune conversion à l'agriculture biologique n'est renseignée.");
    if (c.enConversion === null && surfaceTotaleCAB() <= 0) return nonRetenue(id, "Aucune surface en conversion n'est renseignée.");
    const actif = verifierActifPourAide(id); if (actif) return actif;

    const manquants = [];
    if (c.enConversion === null) manquants.push("Engagement en conversion biologique");
    if (c.premiereOuDeuxiemeAnnee === null) manquants.push("Surface en première ou deuxième année de conversion");
    if (c.premiereOuDeuxiemeAnnee === false) return nonRetenue(id, "Le guide indique que la CAB est accessible aux surfaces en première ou deuxième année de conversion.");
    if (surfaceTotaleCAB() <= 0) manquants.push("Surfaces par catégorie de couvert");
    if (manquants.length) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], manquants);

    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Des surfaces en première ou deuxième année de conversion sont renseignées."], [], ["Un plafond régional peut être fixé pour la campagne d'engagement.", "L'engagement CAB est prévu pour 5 ans."]);
}

function analyserMAEC() {
    const id = "maec_surfaciques";
    const m = profilExploitation.maec;
    if (m.souhaiteExaminer === false || m.souhaiteExaminer === null) return nonRetenue(id, "Aucune recherche de MAEC n'est demandée dans le profil.");
    const actif = verifierActifPourAide(id); if (actif) return actif;
    if (m.offreLocaleConnue === null) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Existence d'une MAEC ouverte localement"]);
    if (m.offreLocaleConnue === false) return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Une recherche de MAEC est souhaitée."], [], ["Les MAEC disponibles dépendent des offres locales ; consulter la DDT(M) ou la chambre d'agriculture."]);
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Une offre MAEC locale est renseignée."], [], ["Le montant et les paramètres du cahier des charges doivent être vérifiés localement."], { type: m.type });
}

/* =========================================================
   RISQUES / PRÉDATION / SECTORIEL / RÉGIONAL
========================================================= */

function analyserAssuranceMRC() {
    const id = "assurance_mrc";
    const a = profilExploitation.assurance;
    if (a.souscritMRC === false) return nonRetenue(id, "Aucun contrat d'assurance MRC n'est renseigné.");
    if (a.souscritMRC === null) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Souscription d'un contrat MRC"]);
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Un contrat MRC est renseigné."], [], ["Le guide indique un taux de prise en charge de 70 % en 2025 ; le taux 2026 n'est pas fourni dans ce document."]);
}

function analyserPredation() {
    const id = "predation";
    const atelier = valeurPositive(profilExploitation.ovins.nombreBrebis) || valeurPositive(profilExploitation.caprins.nombreChevres) || valeurPositive(profilExploitation.petitsRuminantsCorse.nombreBrebis) || valeurPositive(profilExploitation.petitsRuminantsCorse.nombreChevres);
    if (!atelier) return nonRetenue(id, "Aucun troupeau ovin ou caprin n'est renseigné.");
    if (profilExploitation.predation.zoneRisque === false) return nonRetenue(id, "Aucune zone de risque de prédation n'est renseignée.");
    if (profilExploitation.predation.zoneRisque === null) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Classement de la commune dans un cercle de prédation"]);
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Un troupeau ovin/caprin et une zone de risque de prédation sont renseignés."], [], ["Le niveau d'aide dépend du cercle, des dépenses, de la durée de pâturage, de l'effectif et du mode de conduite."]);
}

function analyserProgrammesSectoriels() {
    const id = "programmes_sectoriels";
    const p = profilExploitation.programmesSectoriels;
    if (p.concerne === false || p.concerne === null) return nonRetenue(id, "Aucun programme sectoriel n'est demandé dans le profil.");
    if (!p.secteur) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Secteur concerné"]);

    const secteursOP = ["fruits_legumes", "huile_olive", "proteines", "horticulture", "veau_label", "lapin", "riz"];
    if (secteursOP.includes(p.secteur)) {
        if (p.membreOPAOP === false) return nonRetenue(id, "Pour ce programme opérationnel, les bénéficiaires sont les OP/AOP ; aucune appartenance à une OP/AOP n'est renseignée.");
        if (p.membreOPAOP === null) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Appartenance à une OP/AOP"]);
    }

    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Le secteur renseigné fait partie des programmes sectoriels décrits dans le guide."], [], ["Les interventions et taux d'aide dépendent du programme et du bénéficiaire."], { secteur: p.secteur });
}

function analyserAidesRegionales() {
    const id = "aides_regionales";
    const r = profilExploitation.regional;
    if (r.souhaiteExaminer === false || r.souhaiteExaminer === null) return nonRetenue(id, "Aucune aide régionale n'est demandée dans le profil.");
    if (!r.type) return creerResultatAide(id, STATUT_AIDE.INFORMATIONS_MANQUANTES, [], ["Type d'aide régionale recherchée"]);
    return creerResultatAide(id, STATUT_AIDE.A_EXAMINER, ["Le type d'intervention renseigné relève des aides régionales mentionnées dans le guide."], [], ["Les conditions et montants sont définis par la Région compétente ; le guide national ne fournit pas de formule uniforme."], { type: r.type });
}

/* =========================================================
   ANALYSE GLOBALE
========================================================= */

function analyserToutesLesAides() {
    return [
        analyserAideBase(),
        analyserEcoregime(),
        analyserAideRedistributive(),
        analyserACJA(),
        analyserLegumineusesGraines(),
        analyserLegumineusesFourrageres(),
        analyserBleDur(),
        analyserPommeTerreFeculiere(),
        analyserRiz(),
        analyserHoublon(),
        analyserSemencesGraminees(),
        analyserChanvre(),
        analyserMaraichage(),
        analyserFruitsTransformes(),
        analyserBovins(),
        analyserVeauxQualite(),
        analyserOvins(),
        analyserCaprins(),
        analyserBovinsCorse(),
        analyserPetitsRuminantsCorse(),
        analyserICHNAnimale(),
        analyserICHNVegetale(),
        analyserCAB(),
        analyserMAEC(),
        analyserAssuranceMRC(),
        analyserPredation(),
        analyserProgrammesSectoriels(),
        analyserAidesRegionales()
    ];
}

function aidesAExaminer() {
    return analyserToutesLesAides().filter(r => r.statut === STATUT_AIDE.A_EXAMINER);
}

function aidesInformationsManquantes() {
    return analyserToutesLesAides().filter(r => r.statut === STATUT_AIDE.INFORMATIONS_MANQUANTES);
}
