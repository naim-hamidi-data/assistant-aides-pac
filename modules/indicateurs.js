/* =========================================================
   INDICATEURS DÉRIVÉS

   Ce module transforme les informations brutes de
   l'exploitation en indicateurs PAC : agriculteur actif,
   score écorégime, ratios, UGB, qualification JA, etc.
========================================================= */

function valeurConnue(v) {
    return v !== null && v !== undefined && v !== "";
}

function ratio(num, den) {
    const d = nombreOuZero(den);
    if (d <= 0) return null;
    return nombreOuZero(num) / d;
}

function premierBareme(ratioValeur, bareme) {
    if (ratioValeur === null) return 0;
    const ligne = bareme.find(item => ratioValeur >= item.seuil);
    return ligne ? ligne.points : 0;
}

/* =========================================================
   AGRICULTEUR ACTIF
========================================================= */

function calculerAgriculteurActif() {
    const g = profilExploitation.general;
    const s = profilExploitation.statutActif;
    const statut = g.statutJuridique;
    const manquants = [];
    const raisons = [];

    if (g.territoire === "Outre-mer") {
        return {
            statut: null,
            manquants: ["Règles spécifiques Outre-mer non détaillées dans ce moteur"],
            raisons: ["Le guide prévoit une définition spécifique de l'agriculteur actif dans les territoires ultramarins."]
        };
    }

    if (!statut) {
        return { statut: null, manquants: ["Statut juridique"], raisons: [] };
    }

    if (statut === "indivision") {
        return { statut: false, manquants: [], raisons: ["Les indivisions ne sont pas considérées comme agriculteurs actifs, hors cas successoraux spécifiques."] };
    }

    if (statut === "individuel") {
        if (s.affilieATEXA === null) manquants.push("Affiliation ATEXA");
        if (!valeurConnue(s.ageExploitant)) manquants.push("Âge de l'exploitant");
        if (manquants.length) return { statut: null, manquants, raisons };
        if (s.affilieATEXA !== true) return { statut: false, manquants: [], raisons: ["Affiliation ATEXA non renseignée comme satisfaite."] };

        if (nombreOuZero(s.ageExploitant) > 67) {
            if (s.retraiteLiquideeApres67 === null) return { statut: null, manquants: ["Situation de retraite après 67 ans"], raisons };
            if (s.retraiteLiquideeApres67 === true) return { statut: false, manquants: [], raisons: ["Après 67 ans, les droits à la retraite sont renseignés comme liquidés."] };
        }

        raisons.push("Affiliation ATEXA renseignée.");
        raisons.push("Critère d'âge / retraite compatible avec la définition du guide.");
        return { statut: true, manquants: [], raisons };
    }

    const societesCourantes = ["GAEC", "EARL", "SCEA", "SAS", "SARL", "SA"];
    if (societesCourantes.includes(statut)) {
        if (s.sansAssocieATEXA === false || s.associeAffilieATEXA === true) {
            if (s.associeAffilieATEXA === null) manquants.push("Présence d'au moins un associé affilié à l'ATEXA");
            if (s.associeRespecteCritereAgeRetraite === null) manquants.push("Critère âge / retraite de l'associé");
            if (manquants.length) return { statut: null, manquants, raisons };
            if (s.associeAffilieATEXA !== true || s.associeRespecteCritereAgeRetraite !== true) {
                return { statut: false, manquants: [], raisons: ["Aucun associé ne remplit l'ensemble des conditions renseignées pour une personne physique."] };
            }
            return { statut: true, manquants: [], raisons: ["Au moins un associé remplit les conditions renseignées d'une personne physique active."] };
        }

        if (s.sansAssocieATEXA === null) {
            return { statut: null, manquants: ["Présence ou non d'un associé cotisant à l'ATEXA"], raisons };
        }

        if (s.sansAssocieATEXA === true) {
            const champs = [
                [s.activiteAgricoleSociete, "Activité agricole de la société"],
                [s.dirigeantsAffiliesATMPAgricole, "Affiliation AT/MP agricole des dirigeants associés"],
                [s.dirigeantsRespectentRetraite, "Situation retraite des dirigeants associés"],
                [s.dirigeantsDetiennent5Pourcent, "Détention d'au moins 5 % des parts par les dirigeants"]
            ];
            champs.forEach(([v, lib]) => { if (v === null) manquants.push(lib); });
            if (manquants.length) return { statut: null, manquants, raisons };
            if (champs.every(([v]) => v === true)) {
                return { statut: true, manquants: [], raisons: ["Les critères renseignés pour une société sans associé ATEXA sont satisfaits."] };
            }
            return { statut: false, manquants: [], raisons: ["Au moins un critère renseigné pour les sociétés sans associé ATEXA n'est pas satisfait."] };
        }
    }

    if (["association", "fondation", "public", "cooperative", "autre"].includes(statut)) {
        if (s.autrePersonneMoraleActiviteAgricoleStatutaire === null) {
            return { statut: null, manquants: ["Activité agricole statutaire / propre à la structure"], raisons };
        }
        return s.autrePersonneMoraleActiviteAgricoleStatutaire === true
            ? { statut: true, manquants: [], raisons: ["La structure est renseignée comme exerçant l'activité agricole prévue par le guide."] }
            : { statut: false, manquants: [], raisons: ["L'activité agricole nécessaire n'est pas renseignée comme satisfaite."] };
    }

    return { statut: null, manquants: ["Forme juridique à vérifier"], raisons };
}

/* =========================================================
   ASSOLEMENT / ÉCORÉGIME
========================================================= */

function calculerSommeAssolementTA() {
    const a = profilExploitation.assolement;
    return [
        a.prairieTemporaire,
        a.jachereTotale,
        a.legumineuses,
        a.cerealesHiver,
        a.cerealesPrintemps,
        a.plantesSarclees,
        a.oleagineuxHiver,
        a.oleagineuxPrintemps,
        a.autresCultures
    ].reduce((total, v) => total + nombreOuZero(v), 0);
}

function assolementTASuffisammentRenseigne() {
    const ta = nombreOuZero(profilExploitation.surfaces.terresArables);
    if (ta <= 0) return true;
    const a = profilExploitation.assolement;
    const champs = [a.prairieTemporaire, a.jachereTotale, a.legumineuses, a.cerealesHiver, a.cerealesPrintemps, a.plantesSarclees, a.oleagineuxHiver, a.oleagineuxPrintemps, a.autresCultures];
    if (!champs.some(valeurConnue)) return false;
    const somme = calculerSommeAssolementTA();
    const tolerance = Math.max(0.5, ta * 0.05);
    return Math.abs(somme - ta) <= tolerance;
}

function calculerScoreDiversification() {
    const r = REFERENTIEL_PAC.ecoregime.diversification;
    const s = profilExploitation.surfaces;
    const a = profilExploitation.assolement;
    const ta = nombreOuZero(s.terresArables);
    const sau = nombreOuZero(s.sau);

    if (ta <= 0) {
        return { points: 0, complet: true, details: [], ecartAssolement: 0 };
    }

    const complet = assolementTASuffisammentRenseigne();
    const details = [];
    let points = 0;

    const ptEco = nombreOuZero(a.prairieTemporaire) + nombreOuZero(a.jachereEcoEligible);
    const ratioPT = ptEco / ta;
    const pPT = premierBareme(ratioPT, r.prairieTemporaireEtJachere);
    if (pPT > 0) details.push({ libelle: "Prairie temporaire / jachère écorégime", points: pPT, ratio: ratioPT });
    points += pPT;

    const legumes = nombreOuZero(a.legumineuses);
    const ratioLeg = legumes / ta;
    let pLeg = 0;
    if (ratioLeg >= 0.10) pLeg = 3;
    else if (ratioLeg >= 0.05 || legumes > r.seuilLegumineusesHaAlternative) pLeg = 2;
    if (pLeg > 0) details.push({ libelle: "Légumineuses", points: pLeg, ratio: ratioLeg });
    points += pLeg;

    const bloc = r.blocCerealesSarcleesOleagineux;
    const categoriesBloc = [
        ["Céréales d'hiver", nombreOuZero(a.cerealesHiver), bloc.cerealesHiver.seuil],
        ["Céréales de printemps", nombreOuZero(a.cerealesPrintemps), bloc.cerealesPrintemps.seuil],
        ["Plantes sarclées", nombreOuZero(a.plantesSarclees), bloc.plantesSarclees.seuil],
        ["Oléagineux d'hiver", nombreOuZero(a.oleagineuxHiver), bloc.oleagineuxHiver.seuil],
        ["Oléagineux de printemps", nombreOuZero(a.oleagineuxPrintemps), bloc.oleagineuxPrintemps.seuil]
    ];
    let pBloc = 0;
    categoriesBloc.forEach(([libelle, surface, seuil]) => {
        if (surface / ta >= seuil) {
            pBloc += 1;
            details.push({ libelle, points: 1, ratio: surface / ta });
        }
    });
    pBloc = Math.min(bloc.plafondPoints, pBloc);
    if (pBloc === 0) {
        const sommeBloc = categoriesBloc.reduce((t, [, surface]) => t + surface, 0);
        if (sommeBloc / ta >= bloc.secoursSiAucunSeuil.seuilSomme) {
            pBloc = bloc.secoursSiAucunSeuil.points;
            details.push({ libelle: "Ensemble céréales / sarclées / oléagineux", points: pBloc, ratio: sommeBloc / ta });
        }
    }
    points += pBloc;

    const autres = nombreOuZero(a.autresCultures);
    const ratioAutres = autres / ta;
    const pAutres = premierBareme(ratioAutres, r.autresCultures);
    if (pAutres > 0) details.push({ libelle: "Autres cultures", points: pAutres, ratio: ratioAutres });
    points += pAutres;

    if (sau > 0) {
        const ratioPP = nombreOuZero(s.prairiesPermanentes) / sau;
        const pPP = premierBareme(ratioPP, r.prairiePermanenteDansSAU);
        if (pPP > 0) details.push({ libelle: "Prairies permanentes dans la SAU", points: pPP, ratio: ratioPP });
        points += pPP;
    }

    if (ta < 10) {
        points += r.bonusTerresArablesMoins10Ha;
        details.push({ libelle: "Terres arables < 10 ha", points: r.bonusTerresArablesMoins10Ha, ratio: null });
    }

    return {
        points,
        complet,
        details,
        sommeAssolement: calculerSommeAssolementTA(),
        terresArables: ta,
        ecartAssolement: calculerSommeAssolementTA() - ta
    };
}

function categorieSignificative(surface) {
    const admissible = nombreOuZero(profilExploitation.surfaces.surfaceAdmissible);
    if (admissible <= 0) return false;
    return nombreOuZero(surface) / admissible >= REFERENTIEL_PAC.ecoregime.seuilCategorieSignificative;
}

function evaluerEcoregimePratiques() {
    const s = profilExploitation.surfaces;
    const p = profilExploitation.pratiques;
    const score = calculerScoreDiversification();
    const exigences = [];
    const manquants = [];
    let echec = null;

    if (nombreOuZero(s.surfaceAdmissible) <= 0) {
        return { eligible: false, niveau: null, manquants: ["Surface admissible"], exigences, score };
    }

    if (categorieSignificative(s.terresArables)) {
        if (!score.complet) manquants.push("Répartition complète des terres arables par catégories écorégime");
        else if (score.points < 4) echec = `Score de diversification calculé : ${score.points} point(s), inférieur au niveau de base.`;
        else exigences.push({ compartiment: "Terres arables", niveau: score.points >= 5 ? "superieur" : "base", valeur: `${score.points} points` });
    }

    if (!echec && categorieSignificative(s.prairiesPermanentes)) {
        if (!valeurConnue(p.surfacePPRespectantCritereEcoregime)) manquants.push("Surface de prairies permanentes respectant le critère de non-labour / traitement");
        else {
            const r = ratio(p.surfacePPRespectantCritereEcoregime, s.prairiesPermanentes);
            if (r < REFERENTIEL_PAC.ecoregime.pratiques.prairiePermanenteBase) echec = "Moins de 80 % des prairies permanentes respectent le critère écorégime.";
            else exigences.push({ compartiment: "Prairies permanentes", niveau: r >= REFERENTIEL_PAC.ecoregime.pratiques.prairiePermanenteSuperieur ? "superieur" : "base", valeur: `${Math.round(r * 1000) / 10} %` });
        }
    }

    if (!echec && categorieSignificative(s.culturesPermanentes)) {
        if (!valeurConnue(p.surfaceCPCouverteEcoregime)) manquants.push("Surface de cultures permanentes avec inter-rangs / surface couverts");
        else {
            const r = ratio(p.surfaceCPCouverteEcoregime, s.culturesPermanentes);
            if (r < REFERENTIEL_PAC.ecoregime.pratiques.culturesPermanentesBase) echec = "Moins de 75 % des cultures permanentes respectent le critère de couverture.";
            else exigences.push({ compartiment: "Cultures permanentes", niveau: r >= REFERENTIEL_PAC.ecoregime.pratiques.culturesPermanentesSuperieur ? "superieur" : "base", valeur: `${Math.round(r * 1000) / 10} %` });
        }
    }

    if (echec) return { eligible: false, niveau: null, manquants: [], motif: echec, exigences, score };
    if (manquants.length) return { eligible: false, niveau: null, manquants, exigences, score };
    if (!exigences.length) return { eligible: false, niveau: null, manquants: ["Répartition des surfaces"], exigences, score };

    const niveau = exigences.every(e => e.niveau === "superieur") ? "superieur" : "base";
    return { eligible: true, niveau, manquants: [], exigences, score };
}

function evaluerEcoregimeCertification() {
    const p = profilExploitation.pratiques;
    if (p.agricultureBiologiqueTouteExploitation === true) return { eligible: true, niveau: "bio", motif: "Agriculture biologique sur l'ensemble de l'exploitation" };
    if (p.hveRenovee === true) return { eligible: true, niveau: "superieur", motif: "Certification HVE rénovée" };
    if (p.certificationCE2Plus === true) return { eligible: true, niveau: "base", motif: "Certification CE2+" };

    const manquants = [];
    if (p.agricultureBiologiqueTouteExploitation === null) manquants.push("Certification AB de l'ensemble de l'exploitation");
    if (p.hveRenovee === null) manquants.push("Certification HVE rénovée");
    if (p.certificationCE2Plus === null) manquants.push("Certification CE2+");
    return { eligible: false, niveau: null, manquants };
}

function calculerIAE() {
    const s = profilExploitation.surfaces;
    const a = profilExploitation.assolement;
    const p = profilExploitation.pratiques;
    const eqHaie = REFERENTIEL_PAC.ecoregime.biodiversite.equivalenceHaieHaParMetre;
    const haiesEquivalentHa = nombreOuZero(p.longueurHaiesTotaleM) * eqHaie;
    const haiesTAEquivalentHa = nombreOuZero(p.longueurHaiesTerresArablesM) * eqHaie;
    const totalEquivalentHa = nombreOuZero(p.iaeAutresEquivalentHa) + nombreOuZero(a.jachereEcoEligible) + haiesEquivalentHa;
    const ratioSAU = ratio(totalEquivalentHa, s.sau);
    const ratioHaiesAdmissible = ratio(haiesEquivalentHa, s.surfaceAdmissible);
    const ratioHaiesTA = ratio(haiesTAEquivalentHa, s.terresArables);

    const donneesComplete =
        valeurConnue(p.iaeAutresEquivalentHa) &&
        valeurConnue(p.longueurHaiesTotaleM) &&
        (nombreOuZero(s.terresArables) <= 0 || valeurConnue(p.longueurHaiesTerresArablesM)) &&
        (nombreOuZero(s.terresArables) <= 0 || valeurConnue(a.jachereEcoEligible));

    return { haiesEquivalentHa, haiesTAEquivalentHa, totalEquivalentHa, ratioSAU, ratioHaiesAdmissible, ratioHaiesTA, donneesComplete };
}

function evaluerEcoregimeBiodiversite() {
    const iae = calculerIAE();
    if (nombreOuZero(profilExploitation.surfaces.sau) <= 0) return { eligible: false, niveau: null, manquants: ["SAU totale"], iae };
    if (!iae.donneesComplete) return { eligible: false, niveau: null, manquants: ["IAE, jachères éligibles et haies"], iae };
    if (iae.ratioSAU >= REFERENTIEL_PAC.ecoregime.biodiversite.superieur) return { eligible: true, niveau: "superieur", manquants: [], iae };
    if (iae.ratioSAU >= REFERENTIEL_PAC.ecoregime.biodiversite.base) return { eligible: true, niveau: "base", manquants: [], iae };
    return { eligible: false, niveau: null, manquants: [], motif: "Moins de 7 % d'IAE / jachères sur la SAU.", iae };
}

function evaluerBonusHaies(voies) {
    const p = profilExploitation.pratiques;
    const s = profilExploitation.surfaces;
    const iae = calculerIAE();
    const voieCompatible = voies.pratiques.eligible || voies.certification.eligible;
    const taApplicable = categorieSignificative(s.terresArables);
    const manquants = [];

    if (!voieCompatible) return { possible: false, manquants: [], motif: "Le bonus nécessite une voie pratiques ou certification." };
    if (p.certificationHaiesDurables === null) manquants.push("Certification de gestion durable des haies");
    if (p.maecEntretienLigneux === null) manquants.push("Engagement éventuel en MAEC entretien des ligneux");
    if (!iae.donneesComplete) manquants.push("Longueur de haies");
    if (manquants.length) return { possible: false, manquants };
    if (p.certificationHaiesDurables !== true) return { possible: false, manquants: [], motif: "Absence de certification de gestion durable des haies." };
    if (p.maecEntretienLigneux === true) return { possible: false, manquants: [], motif: "Incompatibilité avec la MAEC Biodiversité – entretien des ligneux." };
    if ((iae.ratioHaiesAdmissible || 0) < REFERENTIEL_PAC.ecoregime.bonusHaies.seuilSAU) return { possible: false, manquants: [], motif: "Moins de 6 % de haies sur la surface admissible." };
    if (taApplicable && (iae.ratioHaiesTA || 0) < REFERENTIEL_PAC.ecoregime.bonusHaies.seuilTerresArables) return { possible: false, manquants: [], motif: "Moins de 6 % de haies sur les terres arables." };
    return { possible: true, manquants: [], iae };
}

function calculerDiagnosticEcoregime() {
    const pratiques = evaluerEcoregimePratiques();
    const certification = evaluerEcoregimeCertification();
    const biodiversite = evaluerEcoregimeBiodiversite();
    const voies = { pratiques, certification, biodiversite };
    const bonusHaies = evaluerBonusHaies(voies);

    const rang = { base: 1, superieur: 2, bio: 3 };
    const eligibles = Object.entries(voies)
        .filter(([, v]) => v.eligible)
        .map(([voie, v]) => ({ voie, niveau: v.niveau, rang: rang[v.niveau] || 0 }));
    eligibles.sort((a, b) => b.rang - a.rang);

    return {
        voies,
        meilleureVoie: eligibles.length ? eligibles[0] : null,
        voiesEligibles: eligibles,
        bonusHaies,
        scoreDiversification: pratiques.score || calculerScoreDiversification()
    };
}

/* =========================================================
   JEUNE AGRICULTEUR
========================================================= */

function calculerQualificationJA() {
    const i = profilExploitation.installation;
    const manquants = [];
    if (i.premiereInstallation === false) return { eligible: false, manquants: [], motif: "Pas de première installation récente." };
    if (i.premiereInstallation === null) manquants.push("Première installation");
    if (!valeurConnue(i.ageJA)) manquants.push("Âge du JA");
    if (!valeurConnue(i.anneeInstallation)) manquants.push("Année de première installation");
    if (!valeurConnue(profilExploitation.general.anneeDemande)) manquants.push("Année de campagne visée");
    if (i.diplomeAgricoleNiveau4OuPlus === null) manquants.push("Diplôme agricole niveau 4+");
    if (i.diplomeNiveau3OuPlus === null) manquants.push("Diplôme niveau 3+");
    if (!valeurConnue(i.experienceAgricoleMois)) manquants.push("Expérience agricole");
    if (manquants.length) return { eligible: false, manquants };

    if (nombreOuZero(i.ageJA) > 40) return { eligible: false, manquants: [], motif: "Âge supérieur à 40 ans." };
    const annee = nombreOuZero(profilExploitation.general.anneeDemande);
    const installation = nombreOuZero(i.anneeInstallation);
    if (installation > annee || installation < annee - 5) return { eligible: false, manquants: [], motif: "Installation hors de la fenêtre de première installation / cinq années civiles précédentes." };

    const exp = nombreOuZero(i.experienceAgricoleMois);
    const qualifie = i.diplomeAgricoleNiveau4OuPlus === true || exp >= 40 || (i.diplomeNiveau3OuPlus === true && exp >= 24);
    if (!qualifie) return { eligible: false, manquants: [], motif: "Diplôme / expérience insuffisants selon les critères du guide." };
    return { eligible: true, manquants: [], motif: "Critères d'âge, installation et qualification initialement compatibles." };
}

/* =========================================================
   BOVINS / UGB
========================================================= */

function calculerUGBBovines() {
    const b = profilExploitation.bovins;
    const males = nombreOuZero(b.malesPlus2Ans) + 0.6 * nombreOuZero(b.males16a24Mois);
    const femellesViande = nombreOuZero(b.femellesRaceViandePlus2Ans) + 0.6 * nombreOuZero(b.femellesRaceViande16a24Mois);
    const autresFemelles = nombreOuZero(b.autresFemellesPlus2Ans) + 0.6 * nombreOuZero(b.autresFemelles16a24Mois);
    const total = males + femellesViande + autresFemelles;

    const plafondMales = nombreOuZero(b.vachesEligibles);
    const plafondFemellesViande = 2 * nombreOuZero(b.veauxRaceViandeNesGardes90Jours);
    const niveauSuperieurBrut = Math.min(males, plafondMales) + Math.min(femellesViande, plafondFemellesViande);
    const niveauBaseBrut = Math.max(0, total - niveauSuperieurBrut);

    const sfConnue = valeurConnue(profilExploitation.surfaces.surfaceFourragere);
    const plafondSurface = sfConnue ? Math.max(40, 1.4 * nombreOuZero(profilExploitation.surfaces.surfaceFourragere)) : 120;
    const plafondGlobal = Math.min(120, plafondSurface);
    const niveauSuperieurRetenu = Math.min(niveauSuperieurBrut, plafondGlobal);
    const reste = Math.max(0, plafondGlobal - niveauSuperieurRetenu);
    const niveauBaseRetenu = Math.min(niveauBaseBrut, 40, reste);

    return {
        males,
        femellesViande,
        autresFemelles,
        total,
        niveauSuperieurBrut,
        niveauBaseBrut,
        niveauSuperieurRetenu,
        niveauBaseRetenu,
        plafondGlobal,
        surfaceFourragereConnue: sfConnue
    };
}

function calculerUGBTotalesDisponibles() {
    return calculerUGBBovines().total + nombreOuZero(profilExploitation.autresAnimaux.ugbDeclareesHorsBovins);
}

/* =========================================================
   SECTEURS / AUTRES INDICATEURS
========================================================= */

function calculerSecteursPresents() {
    const p = profilExploitation.productionsVegetales;
    const secteurs = [];
    if (nombreOuZero(p.autres.viticulture) > 0) secteurs.push("vin");
    if (nombreOuZero(profilExploitation.autresAnimaux.nombreRuches) > 0) secteurs.push("apiculture");
    if (calculerSurfaceMaraichage() > 0 || sommeSurfacesFruitsTransformes() > 0) secteurs.push("fruits_legumes");
    if (nombreOuZero(p.autres.oliveraie) > 0) secteurs.push("huile_olive");
    if (nombreOuZero(p.legumineusesGraines.surface) > 0 || nombreOuZero(p.legumineusesFourrageres.surface) > 0) secteurs.push("proteines");
    if (nombreOuZero(p.autres.horticulture) > 0) secteurs.push("horticulture");
    if (profilExploitation.veauxQualite.labelRouge === true) secteurs.push("veau_label");
    if (nombreOuZero(profilExploitation.autresAnimaux.nombreLapins) > 0) secteurs.push("lapin");
    if (nombreOuZero(p.riz.surface) > 0) secteurs.push("riz");
    return [...new Set(secteurs)];
}

function calculerIndicateursPAC() {
    return {
        agriculteurActif: calculerAgriculteurActif(),
        ecoregime: calculerDiagnosticEcoregime(),
        qualificationJA: calculerQualificationJA(),
        bovins: calculerUGBBovines(),
        ugbTotalesDisponibles: calculerUGBTotalesDisponibles(),
        secteursPresents: calculerSecteursPresents(),
        sommeAssolementTA: calculerSommeAssolementTA()
    };
}
