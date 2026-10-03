/* =========================================================
   ASSISTANT & SIMULATEUR D'AIDES PAC 2026
   MOTEUR DE CALCUL

   Dépendances :
   - aides.js
   - parametres-2026.js
   - profil.js
   - eligibility.js

   IMPORTANT
   ----------
   Les montants 2024 ne sont jamais présentés comme
   des montants 2026.

   Ils servent uniquement d'ordre de grandeur lorsque
   le montant 2026 n'est pas renseigné.
========================================================= */


/* =========================================================
   1. TYPES DE MONTANTS
========================================================= */

const TYPE_CALCUL = {

    CAMPAGNE_2026:
        "campagne_2026",

    PROFIL_EXPLOITATION:
        "profil_exploitation",

    REFERENCE_2024:
        "reference_2024",

    PARTIEL:
        "calcul_partiel",

    NON_CALCULABLE:
        "non_calculable"
};


/* =========================================================
   2. OUTILS GÉNÉRAUX
========================================================= */

function arrondirMontant(valeur) {

    if (
        valeur === null ||
        valeur === undefined ||
        Number.isNaN(valeur)
    ) {
        return null;
    }

    return Math.round(
        (valeur + Number.EPSILON) * 100
    ) / 100;
}


function formaterMontant(valeur) {

    if (
        valeur === null ||
        valeur === undefined
    ) {
        return "Non calculable";
    }

    return new Intl.NumberFormat(
        "fr-FR",
        {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 2
        }
    ).format(valeur);
}


function creerCalcul({
    id,
    nom,
    montant = null,
    type = TYPE_CALCUL.NON_CALCULABLE,
    anneeReference = null,
    formule = null,
    donnees = {},
    avertissements = [],
    details = {}
}) {

    return {

        id,

        nom,

        montant:
            arrondirMontant(montant),

        montantFormate:
            formaterMontant(montant),

        type,

        anneeReference,

        formule,

        donnees,

        avertissements,

        details
    };
}


/* =========================================================
   3. SÉLECTION D'UN TARIF
========================================================= */

/**
 * Choisit en priorité un montant 2026.
 *
 * Si le montant 2026 n'existe pas, utilise éventuellement
 * la référence 2024.
 */
function choisirTarif(
    montant2026,
    reference2024
) {

    if (
        typeof montant2026 === "number"
    ) {

        return {

            valeur:
                montant2026,

            type:
                TYPE_CALCUL.CAMPAGNE_2026,

            annee:
                2026
        };
    }


    if (
        typeof reference2024 === "number"
    ) {

        return {

            valeur:
                reference2024,

            type:
                TYPE_CALCUL.REFERENCE_2024,

            annee:
                2024
        };
    }


    return {

        valeur: null,

        type:
            TYPE_CALCUL.NON_CALCULABLE,

        annee: null
    };
}


/* =========================================================
   4. AIDE DE BASE / DPB
========================================================= */

function calculerAideBase() {

    const orientation =
        analyserAideBase();

    if (
        orientation.statut ===
        STATUT_AIDE.NON_RETENUE
    ) {

        return creerCalcul({
            id: "aide_base",
            nom: "Aide de base au revenu",
            avertissements: [
                "Aide non retenue par le moteur d'orientation."
            ]
        });
    }


    const dpb =
        profilExploitation.dpb;

    const surface =
        profilExploitation
            .surfaces
            .surfaceAdmissible;


    if (
        dpb.nombreDPBActives === null ||
        surface === null
    ) {

        return creerCalcul({
            id: "aide_base",
            nom: "Aide de base au revenu",
            avertissements: [
                "Nombre de DPB activés ou surface admissible manquant."
            ]
        });
    }


    const nombreActivable =
        Math.min(
            dpb.nombreDPBActives,
            surface
        );


    let valeurMoyenne =
        dpb.valeurMoyenneDPB;


    /*
       Si la valeur moyenne n'est pas renseignée,
       mais que l'utilisateur connaît la valeur totale
       de son portefeuille et son nombre de DPB,
       on calcule une moyenne.
    */

    if (
        valeurMoyenne === null &&
        dpb.valeurTotaleDPB !== null &&
        dpb.nombreDPB !== null &&
        dpb.nombreDPB > 0
    ) {

        valeurMoyenne =
            dpb.valeurTotaleDPB /
            dpb.nombreDPB;
    }


    if (valeurMoyenne === null) {

        return creerCalcul({
            id: "aide_base",
            nom: "Aide de base au revenu",

            avertissements: [
                "La valeur réelle des DPB de l'exploitation est nécessaire pour calculer l'aide de base."
            ],

            donnees: {
                dpbActivables:
                    nombreActivable
            }
        });
    }


    const montant =
        nombreActivable *
        valeurMoyenne;


    return creerCalcul({

        id:
            "aide_base",

        nom:
            "Aide de base au revenu",

        montant,

        type:
            TYPE_CALCUL.PROFIL_EXPLOITATION,

        formule:
            "DPB activables × valeur moyenne des DPB",

        donnees: {

            dpbActivables:
                nombreActivable,

            valeurMoyenneDPB:
                valeurMoyenne
        },

        avertissements: [
            "Le calcul utilise la valeur des DPB renseignée par l'utilisateur."
        ]
    });
}


/* =========================================================
   5. AIDE REDISTRIBUTIVE
========================================================= */

function calculerAideRedistributive() {

    const orientation =
        analyserAideRedistributive();

    if (
        orientation.statut !==
        STATUT_AIDE.A_EXAMINER
    ) {

        return creerCalcul({
            id:
                "aide_redistributive",

            nom:
                "Aide redistributive complémentaire au revenu",

            avertissements:
                orientation.informationsManquantes
        });
    }


    const surface =
        profilExploitation
            .surfaces
            .surfaceAdmissible;


    const hectares =
        Math.min(
            surface,
            PARAMETRES_PAC_2026
                .aideRedistributive
                .hectaresMaximum
        );


    const param =
        PARAMETRES_PAC_2026
            .aideRedistributive;


    const tarif =
        choisirTarif(
            param.montant2026,
            param.reference2024
                .montantParHa
        );


    const gaec =
        profilExploitation
            .general
            .gaecTotal;


    const avertissements = [];


    if (
        tarif.type ===
        TYPE_CALCUL.REFERENCE_2024
    ) {

        avertissements.push(
            "Le montant unitaire utilisé est celui de 2024 et non le montant définitif 2026."
        );
    }


    if (gaec) {

        avertissements.push(
            "La transparence GAEC n'est pas appliquée automatiquement dans ce calcul. Le résultat présenté est donc incomplet pour un GAEC total."
        );
    }


    return creerCalcul({

        id:
            "aide_redistributive",

        nom:
            "Aide redistributive complémentaire au revenu",

        montant:
            tarif.valeur !== null
                ? hectares * tarif.valeur
                : null,

        type:
            gaec
                ? TYPE_CALCUL.PARTIEL
                : tarif.type,

        anneeReference:
            tarif.annee,

        formule:
            "min(surface admissible, 52 ha) × montant unitaire",

        donnees: {

            hectaresRetenus:
                hectares,

            montantUnitaire:
                tarif.valeur
        },

        avertissements
    });
}


/* =========================================================
   6. ACJA
========================================================= */

function calculerACJA() {

    const orientation =
        analyserACJA();


    if (
        orientation.statut !==
        STATUT_AIDE.A_EXAMINER
    ) {

        return creerCalcul({

            id: "acja",

            nom:
                "Aide complémentaire au revenu pour les jeunes agriculteurs",

            avertissements:
                orientation.informationsManquantes
        });
    }


    const param =
        PARAMETRES_PAC_2026.ACJA;


    const tarif =
        choisirTarif(
            param.montant2026,
            param.reference2024
                .montantParExploitation
        );


    const avertissements = [];


    if (
        tarif.type ===
        TYPE_CALCUL.REFERENCE_2024
    ) {

        avertissements.push(
            "Le montant forfaitaire utilisé est la référence 2024."
        );
    }


    if (
        profilExploitation
            .general
            .gaecTotal
    ) {

        avertissements.push(
            "Pour un GAEC total, la transparence peut s'appliquer pour chaque associé remplissant les conditions JA. Le nombre d'associés JA doit être vérifié."
        );
    }


    return creerCalcul({

        id: "acja",

        nom:
            "Aide complémentaire au revenu pour les jeunes agriculteurs",

        montant:
            tarif.valeur,

        type:
            profilExploitation
                .general
                .gaecTotal
                ? TYPE_CALCUL.PARTIEL
                : tarif.type,

        anneeReference:
            tarif.annee,

        formule:
            "Montant forfaitaire annuel",

        donnees: {
            montantForfaitaire:
                tarif.valeur
        },

        avertissements
    });
}


/* =========================================================
   7. ÉCORÉGIME
========================================================= */

function obtenirTarifEcoregime(niveau) {

    const param =
        PARAMETRES_PAC_2026.ecoregime;


    if (niveau === "base") {

        return choisirTarif(
            param.niveauBase2026,
            param.reference2024
                .niveauBase
        );
    }


    if (niveau === "superieur") {

        return choisirTarif(
            param.niveauSuperieur2026,
            param.reference2024
                .niveauSuperieur
        );
    }


    if (
        niveau ===
        "agriculture_biologique"
    ) {

        return choisirTarif(
            param.niveauBio2026,
            param.reference2024
                .niveauBio
        );
    }


    return {
        valeur: null,
        type:
            TYPE_CALCUL.NON_CALCULABLE,
        annee: null
    };
}


function calculerEcoregime() {

    const orientation =
        analyserEcoregime();


    if (
        orientation.statut ===
        STATUT_AIDE.NON_RETENUE
    ) {

        return creerCalcul({

            id: "ecoregime",

            nom: "Écorégime",

            avertissements: [
                "L'écorégime n'est pas retenu par l'orientation actuelle."
            ]
        });
    }


    const surface =
        profilExploitation
            .surfaces
            .surfaceAdmissible;


    if (surface === null) {

        return creerCalcul({

            id: "ecoregime",

            nom: "Écorégime",

            avertissements: [
                "Surface admissible non renseignée."
            ]
        });
    }


    let niveau =
        profilExploitation
            .ecoregime
            .niveauEstime;


    /*
       Si aucun niveau n'est explicitement choisi,
       on regarde les voies détectées par eligibility.js.
    */

    if (!niveau) {

        const voies =
            orientation.details
                ?.voiesPotentielles || [];


        const niveaux =
            [
                ...new Set(
                    voies
                        .map(v => v.niveau)
                        .filter(
                            n =>
                                n !==
                                "a_determiner"
                        )
                )
            ];


        if (niveaux.length === 1) {

            niveau =
                niveaux[0];
        }
    }


    /*
       On prépare également plusieurs scénarios,
       utiles si le niveau n'est pas encore déterminé.
    */

    const scenarios = {};


    [
        "base",
        "superieur",
        "agriculture_biologique"
    ].forEach(n => {

        const tarif =
            obtenirTarifEcoregime(n);

        scenarios[n] = {

            montantUnitaire:
                tarif.valeur,

            montant:
                tarif.valeur !== null
                    ? arrondirMontant(
                        surface *
                        tarif.valeur
                    )
                    : null,

            anneeReference:
                tarif.annee,

            type:
                tarif.type
        };
    });


    if (!niveau) {

        return creerCalcul({

            id: "ecoregime",

            nom: "Écorégime",

            type:
                TYPE_CALCUL.NON_CALCULABLE,

            formule:
                "Surface admissible × montant correspondant au niveau obtenu",

            donnees: {
                surfaceAdmissible:
                    surface
            },

            avertissements: [
                "Le niveau d'écorégime n'est pas encore déterminé.",
                "Plusieurs scénarios sont conservés pour comparaison."
            ],

            details: {
                scenarios
            }
        });
    }


    const tarif =
        obtenirTarifEcoregime(
            niveau
        );


    let montantPrincipal =
        tarif.valeur !== null
            ? surface *
                tarif.valeur
            : null;


    /* BONUS HAIES */

    let bonusHaies = null;

    const bonusEligible =
        orientation.details
            ?.bonusHaies === true;


    if (bonusEligible) {

        const tarifBonus =
            choisirTarif(
                PARAMETRES_PAC_2026
                    .ecoregime
                    .bonusHaies2026,

                PARAMETRES_PAC_2026
                    .ecoregime
                    .reference2024
                    .bonusHaies
            );


        if (
            tarifBonus.valeur !== null
        ) {

            bonusHaies =
                surface *
                tarifBonus.valeur;
        }
    }


    let total =
        montantPrincipal;


    if (
        total !== null &&
        bonusHaies !== null
    ) {

        total += bonusHaies;
    }


    const avertissements = [];


    if (
        niveau === "base" &&
        tarif.valeur === null
    ) {

        avertissements.push(
            "Le guide fourni contient deux montants 2024 différents pour le niveau de base de l'écorégime (48,23 €/ha et 48,35 €/ha). Aucun des deux n'est appliqué automatiquement."
        );
    }


    if (
        tarif.type ===
        TYPE_CALCUL.REFERENCE_2024
    ) {

        avertissements.push(
            "Le montant utilisé correspond à la campagne 2024 et sert uniquement d'ordre de grandeur."
        );
    }


    return creerCalcul({

        id: "ecoregime",

        nom: "Écorégime",

        montant: total,

        type:
            tarif.type,

        anneeReference:
            tarif.annee,

        formule:
            "Surface admissible × montant du niveau obtenu + éventuel bonus haies",

        donnees: {

            surfaceAdmissible:
                surface,

            niveau,

            montantUnitaire:
                tarif.valeur,

            bonusHaies:
                bonusHaies
        },

        avertissements,

        details: {
            scenarios
        }
    });
}


/* =========================================================
   8. FONCTION GÉNÉRIQUE AIDES SURFACIQUES
========================================================= */

function calculerAideSurface({
    id,
    nom,
    surface,
    montant2026,
    reference2024,
    avertissements = []
}) {

    if (
        surface === null ||
        surface === undefined ||
        surface <= 0
    ) {

        return creerCalcul({

            id,
            nom,

            avertissements: [
                ...avertissements,
                "Surface éligible non renseignée."
            ]
        });
    }


    const tarif =
        choisirTarif(
            montant2026,
            reference2024
        );


    if (
        tarif.type ===
        TYPE_CALCUL.REFERENCE_2024
    ) {

        avertissements.push(
            "Le montant unitaire utilisé correspond à la campagne 2024."
        );
    }


    return creerCalcul({

        id,
        nom,

        montant:
            tarif.valeur !== null
                ? surface *
                    tarif.valeur
                : null,

        type:
            tarif.type,

        anneeReference:
            tarif.annee,

        formule:
            "Surface éligible × montant unitaire",

        donnees: {

            surface,

            montantUnitaire:
                tarif.valeur
        },

        avertissements
    });
}


/* =========================================================
   9. LÉGUMINEUSES À GRAINES
========================================================= */

function calculerLegumineusesGraines() {

    const production =
        profilExploitation
            .productionsVegetales
            .legumineusesGraines;


    if (!production.presente) {

        return creerCalcul({
            id: "legumineuses_graines",
            nom:
                "Aide aux légumineuses à graines"
        });
    }


    const param =
        PARAMETRES_PAC_2026
            .aidesCouplees
            .vegetales
            .legumineusesGraines;


    return calculerAideSurface({

        id:
            "legumineuses_graines",

        nom:
            "Aide aux légumineuses à graines et productions assimilées",

        surface:
            production.surface,

        montant2026:
            param.montant2026,

        reference2024:
            param.reference2024,

        avertissements: [
            "La surface et les conditions exactes de production doivent être vérifiées avant de considérer ce montant."
        ]
    });
}


/* =========================================================
   10. LÉGUMINEUSES FOURRAGÈRES
========================================================= */

function calculerLegumineusesFourrageres() {

    const orientation =
        analyserLegumineusesFourrageres();


    if (
        orientation.statut !==
        STATUT_AIDE.A_EXAMINER
    ) {

        return creerCalcul({

            id:
                "legumineuses_fourrageres",

            nom:
                "Aide aux légumineuses fourragères",

            avertissements:
                orientation
                    .informationsManquantes
        });
    }


    const production =
        profilExploitation
            .productionsVegetales
            .legumineusesFourrageres;


    const params =
        PARAMETRES_PAC_2026
            .aidesCouplees
            .vegetales
            .legumineusesFourrageres;


    let param;


    if (
        production.zone ===
        "montagne"
    ) {

        param =
            params.montagne;
    }

    else if (
        production.zone ===
        "plaine_piemont"
    ) {

        param =
            params.plainePiemont;
    }

    else {

        return creerCalcul({

            id:
                "legumineuses_fourrageres",

            nom:
                "Aide aux légumineuses fourragères",

            avertissements: [
                "La zone plaine/piémont ou montagne doit être renseignée."
            ]
        });
    }


    return calculerAideSurface({

        id:
            "legumineuses_fourrageres",

        nom:
            "Aide aux légumineuses fourragères",

        surface:
            production.surface,

        montant2026:
            param.montant2026,

        reference2024:
            param.reference2024
    });
}


/* =========================================================
   11. BLÉ DUR
========================================================= */

function calculerBleDur() {

    const orientation =
        analyserBleDur();


    if (
        orientation.statut !==
        STATUT_AIDE.A_EXAMINER
    ) {

        return creerCalcul({

            id: "ble_dur",

            nom:
                "Aide couplée au blé dur",

            avertissements:
                orientation
                    .informationsManquantes
        });
    }


    const production =
        profilExploitation
            .productionsVegetales
            .bleDur;


    const param =
        PARAMETRES_PAC_2026
            .aidesCouplees
            .vegetales
            .bleDur;


    return calculerAideSurface({

        id: "ble_dur",

        nom:
            "Aide couplée au blé dur",

        surface:
            production.surface,

        montant2026:
            param.montant2026,

        reference2024:
            param.reference2024
    });
}


/* =========================================================
   12. AUTRES AIDES VÉGÉTALES
========================================================= */

function calculerPommeTerreFeculiere() {

    const p =
        profilExploitation
            .productionsVegetales
            .pommeTerreFeculiere;


    if (!p.presente) {

        return creerCalcul({
            id:
                "pomme_terre_feculiere",

            nom:
                "Aide pommes de terre féculières"
        });
    }


    const param =
        PARAMETRES_PAC_2026
            .aidesCouplees
            .vegetales
            .pommeTerreFeculiere;


    return calculerAideSurface({

        id:
            "pomme_terre_feculiere",

        nom:
            "Aide pommes de terre féculières",

        surface:
            p.surface,

        montant2026:
            param.montant2026,

        reference2024:
            param.reference2024,

        avertissements:
            p.contratTransformation === true
                ? []
                : [
                    "Le contrat de culture ou de transformation doit être vérifié."
                ]
    });
}


function calculerRiz() {

    const p =
        profilExploitation
            .productionsVegetales
            .riz;


    if (!p.presente) {

        return creerCalcul({
            id: "riz",
            nom:
                "Aide couplée au riz"
        });
    }


    const param =
        PARAMETRES_PAC_2026
            .aidesCouplees
            .vegetales
            .riz;


    return calculerAideSurface({

        id: "riz",

        nom:
            "Aide couplée au riz",

        surface:
            p.surface,

        montant2026:
            param.montant2026,

        reference2024:
            param.reference2024
    });
}


function calculerHoublon() {

    const p =
        profilExploitation
            .productionsVegetales
            .houblon;


    if (!p.presente) {

        return creerCalcul({
            id: "houblon",
            nom:
                "Aide couplée au houblon"
        });
    }


    const param =
        PARAMETRES_PAC_2026
            .aidesCouplees
            .vegetales
            .houblon;


    return calculerAideSurface({

        id: "houblon",

        nom:
            "Aide couplée au houblon",

        surface:
            p.surface,

        montant2026:
            param.montant2026,

        reference2024:
            param.reference2024
    });
}


function calculerSemencesGraminees() {

    const p =
        profilExploitation
            .productionsVegetales
            .semencesGraminees;


    if (!p.presente) {

        return creerCalcul({
            id:
                "semences_graminees",

            nom:
                "Aide aux semences de graminées"
        });
    }


    const param =
        PARAMETRES_PAC_2026
            .aidesCouplees
            .vegetales
            .semencesGraminees;


    return calculerAideSurface({

        id:
            "semences_graminees",

        nom:
            "Aide aux semences de graminées",

        surface:
            p.surface,

        montant2026:
            param.montant2026,

        reference2024:
            param.reference2024,

        avertissements: [
            "Le contrat de culture et la variété doivent être vérifiés."
        ]
    });
}


function calculerChanvre() {

    const p =
        profilExploitation
            .productionsVegetales
            .chanvre;


    if (!p.presente) {

        return creerCalcul({
            id: "chanvre",
            nom:
                "Aide couplée au chanvre"
        });
    }


    const param =
        PARAMETRES_PAC_2026
            .aidesCouplees
            .vegetales
            .chanvre;


    return calculerAideSurface({

        id: "chanvre",

        nom:
            "Aide couplée au chanvre",

        surface:
            p.surface,

        montant2026:
            param.montant2026,

        reference2024:
            param.reference2024,

        avertissements:
            p.contratTransformation === true
                ? []
                : [
                    "Le contrat avec une entreprise de transformation ou de semences doit être vérifié."
                ]
    });
}


/* =========================================================
   13. MARAÎCHAGE
========================================================= */

function calculerMaraichage() {

    const orientation =
        analyserMaraichage();


    if (
        orientation.statut !==
        STATUT_AIDE.A_EXAMINER
    ) {

        return creerCalcul({

            id:
                "petit_maraichage",

            nom:
                "Aide couplée au maraîchage",

            avertissements:
                orientation
                    .informationsManquantes
        });
    }


    const surface =
        calculerSurfaceMaraichage();


    const param =
        PARAMETRES_PAC_2026
            .aidesCouplees
            .vegetales
            .maraichage;


    return calculerAideSurface({

        id:
            "petit_maraichage",

        nom:
            "Aide couplée au maraîchage",

        surface,

        montant2026:
            param.montant2026,

        reference2024:
            param.reference2024
    });
}


/* =========================================================
   14. FRUITS / TOMATE TRANSFORMÉS
========================================================= */

function calculerFruitsTransformes() {

    const productions =
        profilExploitation
            .productionsVegetales
            .fruitsTransformes;


    const params =
        PARAMETRES_PAC_2026
            .aidesCouplees
            .vegetales
            .fruitsTransformes;


    const correspondances = [

        [
            "pruneEnte",
            "Prune d'Ente",
            params.pruneEnte
        ],

        [
            "ceriseBigarreau",
            "Cerise Bigarreau",
            params.ceriseBigarreau
        ],

        [
            "poireWilliams",
            "Poire Williams",
            params.poireWilliams
        ],

        [
            "pechePavie",
            "Pêche Pavie",
            params.pechePavie
        ],

        [
            "tomateIndustrie",
            "Tomate d'industrie",
            params.tomateIndustrie
        ]
    ];


    return correspondances.map(
        ([cle, nom, param]) => {

            const production =
                productions[cle];


            if (!production.presente) {

                return creerCalcul({

                    id:
                        `fruit_transforme_${cle}`,

                    nom
                });
            }


            return calculerAideSurface({

                id:
                    `fruit_transforme_${cle}`,

                nom:
                    `Aide ${nom}`,

                surface:
                    production.surface,

                montant2026:
                    param.montant2026,

                reference2024:
                    param.reference2024,

                avertissements:
                    production
                        .deboucheIndustriel
                        === true
                        ? []
                        : [
                            "Le débouché industriel ou le contrat de transformation doit être vérifié."
                        ]
            });
        }
    );
}


/* =========================================================
   15. AIDE BOVINE
========================================================= */

function calculerBovins() {

    const orientation =
        analyserBovins();


    if (
        orientation.statut !==
        STATUT_AIDE.A_EXAMINER
    ) {

        return creerCalcul({

            id:
                "bovins_hexagone",

            nom:
                "Aide bovine",

            avertissements:
                orientation
                    .informationsManquantes
        });
    }


    const bovins =
        profilExploitation.bovins;


    if (
        bovins.ugbNiveauSuperieur === null ||
        bovins.ugbNiveauBase === null
    ) {

        return creerCalcul({

            id:
                "bovins_hexagone",

            nom:
                "Aide bovine",

            avertissements: [
                "Les UGB relevant du niveau supérieur et du niveau de base doivent être déterminées."
            ]
        });
    }


    if (
        profilExploitation
            .general
            .gaecTotal
    ) {

        return creerCalcul({

            id:
                "bovins_hexagone",

            nom:
                "Aide bovine",

            type:
                TYPE_CALCUL.PARTIEL,

            avertissements: [
                "La transparence GAEC modifie les plafonds. Le calcul exact nécessite les informations relatives aux associés et aux parts correspondantes."
            ]
        });
    }


    const surfaceFourragere =
        profilExploitation
            .surfaces
            .surfaceFourragere;


    if (surfaceFourragere === null) {

        return creerCalcul({

            id:
                "bovins_hexagone",

            nom:
                "Aide bovine",

            avertissements: [
                "La surface fourragère est nécessaire pour appliquer le plafond."
            ]
        });
    }


    /*
       Plafond global :
       - maximum 120 UGB
       - 1,4 × surface fourragère
       - les premières 40 UGB sont protégées
    */

    const plafondSurface =
        Math.max(
            40,
            1.4 *
            surfaceFourragere
        );


    const plafondGlobal =
        Math.min(
            120,
            plafondSurface
        );


    const ugbSuperieures =
        Math.min(
            bovins.ugbNiveauSuperieur,
            plafondGlobal
        );


    const reste =
        Math.max(
            0,
            plafondGlobal -
            ugbSuperieures
        );


    const ugbBase =
        Math.min(
            bovins.ugbNiveauBase,
            40,
            reste
        );


    const param =
        PARAMETRES_PAC_2026
            .aidesCouplees
            .animales
            .bovinsHexagone;


    const tarifSup =
        choisirTarif(
            param.superieur
                .montant2026,

            param.superieur
                .reference2024
        );


    const tarifBase =
        choisirTarif(
            param.base
                .montant2026,

            param.base
                .reference2024
        );


    if (
        tarifSup.valeur === null ||
        tarifBase.valeur === null
    ) {

        return creerCalcul({

            id:
                "bovins_hexagone",

            nom:
                "Aide bovine",

            avertissements: [
                "Les montants unitaires nécessaires au calcul ne sont pas renseignés."
            ]
        });
    }


    const montant =
        (
            ugbSuperieures *
            tarifSup.valeur
        ) +
        (
            ugbBase *
            tarifBase.valeur
        );


    return creerCalcul({

        id:
            "bovins_hexagone",

        nom:
            "Aide bovine",

        montant,

        type:
            tarifSup.type ===
            TYPE_CALCUL.CAMPAGNE_2026 &&
            tarifBase.type ===
            TYPE_CALCUL.CAMPAGNE_2026

                ? TYPE_CALCUL.CAMPAGNE_2026
                : TYPE_CALCUL.REFERENCE_2024,

        anneeReference:
            tarifSup.annee,

        formule:
            "(UGB niveau supérieur × tarif supérieur) + (UGB niveau de base × tarif de base)",

        donnees: {

            ugbSuperieures,

            ugbBase,

            plafondGlobal,

            surfaceFourragere,

            tarifSuperieur:
                tarifSup.valeur,

            tarifBase:
                tarifBase.valeur
        },

        avertissements: [
            "Le résultat suppose que les UGB renseignées dans chaque niveau ont déjà été correctement qualifiées."
        ]
    });
}


/* =========================================================
   16. VEAUX SOUS LA MÈRE / BIO
========================================================= */

function calculerVeauxQualite() {

    const orientation =
        analyserVeauxQualite();


    if (
        orientation.statut !==
        STATUT_AIDE.A_EXAMINER
    ) {

        return creerCalcul({

            id:
                "veaux_qualite",

            nom:
                "Aide aux veaux sous la mère et veaux bio",

            avertissements:
                orientation
                    .informationsManquantes
        });
    }


    const nombre =
        profilExploitation
            .veauxQualite
            .nombreVeauxEligibles;


    const param =
        PARAMETRES_PAC_2026
            .aidesCouplees
            .animales
            .veauxQualite;


    const tarif =
        choisirTarif(
            param.montant2026,
            param.reference2024
        );


    return creerCalcul({

        id:
            "veaux_qualite",

        nom:
            "Aide aux veaux sous la mère et veaux bio",

        montant:
            tarif.valeur !== null
                ? nombre *
                    tarif.valeur
                : null,

        type:
            tarif.type,

        anneeReference:
            tarif.annee,

        formule:
            "Nombre de veaux éligibles × montant unitaire",

        donnees: {

            nombreVeaux:
                nombre,

            montantUnitaire:
                tarif.valeur
        }
    });
}


/* =========================================================
   17. AIDE OVINE
========================================================= */

function calculerOvins() {

    const orientation =
        analyserOvins();


    if (
        orientation.statut !==
        STATUT_AIDE.A_EXAMINER
    ) {

        return creerCalcul({

            id:
                "ovins_hexagone",

            nom:
                "Aide ovine",

            avertissements:
                orientation
                    .informationsManquantes
        });
    }


    const ovins =
        profilExploitation.ovins;


    let brebis =
        ovins.nombreBrebisEligibles !== null
            ? ovins.nombreBrebisEligibles
            : ovins.nombreBrebis;


    let brebisPrimees =
        brebis;


    /*
       Les nouveaux producteurs ne sont pas soumis
       au ratio national de productivité.
    */

    if (
        ovins.nouveauProducteur !== true
    ) {

        const ratio =
            calculerRatioProductiviteOvine();


        if (ratio === null) {

            return creerCalcul({

                id:
                    "ovins_hexagone",

                nom:
                    "Aide ovine",

                avertissements: [
                    "Le ratio de productivité doit être calculé."
                ]
            });
        }


        if (ratio < 0.5) {

            brebisPrimees =
                brebis *
                (ratio / 0.5);
        }
    }


    const param =
        PARAMETRES_PAC_2026
            .aidesCouplees
            .animales
            .ovinsHexagone;


    const tarifBase =
        choisirTarif(
            param.base.montant2026,
            param.base.reference2024
        );


    const tarifMajoration =
        choisirTarif(
            param
                .majoration500Premieres
                .montant2026,

            param
                .majoration500Premieres
                .reference2024
        );


    const tarifNouveau =
        choisirTarif(
            param
                .nouveauProducteur
                .montant2026,

            param
                .nouveauProducteur
                .reference2024
        );


    if (
        tarifBase.valeur === null
    ) {

        return creerCalcul({

            id:
                "ovins_hexagone",

            nom:
                "Aide ovine",

            avertissements: [
                "Montant unitaire de l'aide ovine non renseigné."
            ]
        });
    }


    let montant =
        brebisPrimees *
        tarifBase.valeur;


    /* Majoration des premières brebis */

    if (
        tarifMajoration.valeur !== null
    ) {

        montant +=
            Math.min(
                brebisPrimees,
                500
            ) *
            tarifMajoration.valeur;
    }


    /* Nouveau producteur */

    if (
        ovins.nouveauProducteur === true &&
        tarifNouveau.valeur !== null
    ) {

        montant +=
            brebisPrimees *
            tarifNouveau.valeur;
    }


    const avertissements = [];


    if (
        profilExploitation
            .general
            .gaecTotal
    ) {

        avertissements.push(
            "La transparence GAEC sur la majoration des 500 premières brebis n'est pas calculée automatiquement."
        );
    }


    return creerCalcul({

        id:
            "ovins_hexagone",

        nom:
            "Aide ovine",

        montant,

        type:
            tarifBase.type,

        anneeReference:
            tarifBase.annee,

        formule:
            "Brebis primables × aide de base + majoration + éventuelle aide nouveau producteur",

        donnees: {

            brebisEligibles:
                brebis,

            brebisPrimees:
                arrondirMontant(
                    brebisPrimees
                ),

            montantBase:
                tarifBase.valeur,

            nouveauProducteur:
                ovins.nouveauProducteur
        },

        avertissements
    });
}


/* =========================================================
   18. AIDE CAPRINE
========================================================= */

function calculerCaprins() {

    const orientation =
        analyserCaprins();


    if (
        orientation.statut !==
        STATUT_AIDE.A_EXAMINER
    ) {

        return creerCalcul({

            id:
                "caprins_hexagone",

            nom:
                "Aide caprine",

            avertissements:
                orientation
                    .informationsManquantes
        });
    }


    const caprins =
        profilExploitation.caprins;


    let chevres =
        caprins.nombreChevresEligibles !== null
            ? caprins.nombreChevresEligibles
            : caprins.nombreChevres;


    const avertissements = [];


    if (
        profilExploitation
            .general
            .gaecTotal
    ) {

        avertissements.push(
            "La transparence GAEC sur le plafond de 400 chèvres doit être vérifiée."
        );
    }

    else {

        chevres =
            Math.min(
                chevres,
                400
            );
    }


    const param =
        PARAMETRES_PAC_2026
            .aidesCouplees
            .animales
            .caprinsHexagone;


    const tarif =
        choisirTarif(
            param.montant2026,
            param.reference2024
        );


    return creerCalcul({

        id:
            "caprins_hexagone",

        nom:
            "Aide caprine",

        montant:
            tarif.valeur !== null
                ? chevres *
                    tarif.valeur
                : null,

        type:
            profilExploitation
                .general
                .gaecTotal
                ? TYPE_CALCUL.PARTIEL
                : tarif.type,

        anneeReference:
            tarif.annee,

        formule:
            "Nombre de chèvres primables × montant unitaire",

        donnees: {

            chevresPrimees:
                chevres,

            montantUnitaire:
                tarif.valeur
        },

        avertissements
    });
}


/* =========================================================
   19. CALCUL GLOBAL
========================================================= */

function calculerToutesLesAides() {

    return [

        calculerAideBase(),

        calculerAideRedistributive(),

        calculerACJA(),

        calculerEcoregime(),

        calculerLegumineusesGraines(),

        calculerLegumineusesFourrageres(),

        calculerBleDur(),

        calculerPommeTerreFeculiere(),

        calculerRiz(),

        calculerHoublon(),

        calculerSemencesGraminees(),

        calculerChanvre(),

        calculerMaraichage(),

        ...calculerFruitsTransformes(),

        calculerBovins(),

        calculerVeauxQualite(),

        calculerOvins(),

        calculerCaprins()

    ];
}


/* =========================================================
   20. SYNTHÈSE FINANCIÈRE
========================================================= */

function calculerSyntheseFinanciere() {

    const calculs =
        calculerToutesLesAides();


    let total2026 = 0;

    let totalReference2024 = 0;

    let nombre2026 = 0;

    let nombreReference = 0;


    calculs.forEach(
        calcul => {

            if (calcul.montant === null) {
                return;
            }


            if (
                calcul.type ===
                TYPE_CALCUL.CAMPAGNE_2026 ||
                calcul.type ===
                TYPE_CALCUL.PROFIL_EXPLOITATION
            ) {

                total2026 +=
                    calcul.montant;

                nombre2026++;
            }


            if (
                calcul.type ===
                TYPE_CALCUL.REFERENCE_2024
            ) {

                totalReference2024 +=
                    calcul.montant;

                nombreReference++;
            }
        }
    );


    return {

        total2026:
            arrondirMontant(
                total2026
            ),

        total2026Formate:
            formaterMontant(
                total2026
            ),

        nombreAidesCalculees2026:
            nombre2026,


        totalReference2024:
            arrondirMontant(
                totalReference2024
            ),

        totalReference2024Formate:
            formaterMontant(
                totalReference2024
            ),

        nombreAidesReference2024:
            nombreReference,


        calculs
    };
}


/* =========================================================
   21. TEST CONSOLE
========================================================= */

function testerCalculs() {

    const synthese =
        calculerSyntheseFinanciere();


    console.table(

        synthese.calculs.map(
            calcul => ({

                aide:
                    calcul.nom,

                montant:
                    calcul.montantFormate,

                type:
                    calcul.type,

                reference:
                    calcul.anneeReference
            })
        )
    );


    console.log(
        "Total calculable 2026 :",
        synthese.total2026Formate
    );


    console.log(
        "Sous-total basé sur références 2024 :",
        synthese
            .totalReference2024Formate
    );


    return synthese;
}
