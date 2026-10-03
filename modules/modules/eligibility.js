/* =========================================================
   ASSISTANT & SIMULATEUR D'AIDES PAC 2026
   MOTEUR D'ORIENTATION / ÉLIGIBILITÉ

   IMPORTANT
   ----------
   Ce moteur réalise une pré-orientation.
   Il ne constitue pas une décision administrative
   d'éligibilité.

   Il s'appuie sur :
   - profil.js
   - aides.js
========================================================= */


/* =========================================================
   1. STATUTS POSSIBLES
========================================================= */

const STATUT_AIDE = {

    A_EXAMINER: "a_examiner",

    INFORMATIONS_MANQUANTES:
        "informations_manquantes",

    NON_RETENUE:
        "non_retenue"
};


/* =========================================================
   2. FONCTIONS GÉNÉRALES
========================================================= */

function creerResultatAide(
    idAide,
    statut,
    raisons = [],
    informationsManquantes = [],
    pointsAVerifier = [],
    details = {}
) {

    const aide = AIDES_PAC.find(
        aide => aide.id === idAide
    );

    return {

        id: idAide,

        nom: aide
            ? aide.nom
            : idAide,

        statut: statut,

        raisons: raisons,

        informationsManquantes:
            informationsManquantes,

        pointsAVerifier:
            pointsAVerifier,

        details: details
    };
}


function valeurRenseignee(valeur) {

    return (
        valeur !== null &&
        valeur !== undefined &&
        valeur !== ""
    );
}


function estOui(valeur) {
    return valeur === true;
}


function estNon(valeur) {
    return valeur === false;
}


/* =========================================================
   3. CONDITIONS TRANSVERSALES
========================================================= */

function verifierAgriculteurActif() {

    const actif =
        profilExploitation
            .agriculteurActif
            .statut;

    if (actif === true) {

        return {
            valide: true,
            inconnu: false
        };
    }

    if (actif === false) {

        return {
            valide: false,
            inconnu: false
        };
    }

    return {
        valide: false,
        inconnu: true
    };
}


/* =========================================================
   4. AIDE DE BASE / DPB
========================================================= */

function analyserAideBase() {

    const raisons = [];
    const manquants = [];
    const verifications = [];

    const actif =
        verifierAgriculteurActif();

    if (actif.inconnu) {

        manquants.push(
            "Statut d'agriculteur actif"
        );
    }

    if (!actif.inconnu && !actif.valide) {

        return creerResultatAide(
            "aide_base",
            STATUT_AIDE.NON_RETENUE,
            [],
            [],
            [
                "Le demandeur n'est pas renseigné comme agriculteur actif."
            ]
        );
    }


    const detientDPB =
        profilExploitation
            .dpb
            .detientDPB;

    const nombreDPBActives =
        profilExploitation
            .dpb
            .nombreDPBActives;

    const surfaceAdmissible =
        profilExploitation
            .surfaces
            .surfaceAdmissible;


    if (detientDPB === false) {

        return creerResultatAide(
            "aide_base",
            STATUT_AIDE.NON_RETENUE,
            raisons,
            [],
            [
                "Aucun DPB n'est actuellement déclaré dans le profil.",
                "Vérifier éventuellement les possibilités d'attribution ou de transfert de DPB."
            ]
        );
    }


    if (
        detientDPB === null &&
        nombreDPBActives === null
    ) {

        manquants.push(
            "Présence de DPB"
        );
    }


    if (
        nombreDPBActives !== null &&
        nombreDPBActives <= 0
    ) {

        return creerResultatAide(
            "aide_base",
            STATUT_AIDE.NON_RETENUE,
            [],
            [],
            [
                "Aucun DPB activé n'a été renseigné."
            ]
        );
    }


    if (surfaceAdmissible === null) {

        manquants.push(
            "Surface admissible"
        );
    }


    if (
        surfaceAdmissible !== null &&
        surfaceAdmissible <= 0
    ) {

        return creerResultatAide(
            "aide_base",
            STATUT_AIDE.NON_RETENUE,
            [],
            [],
            [
                "Aucune surface admissible n'a été renseignée."
            ]
        );
    }


    if (manquants.length > 0) {

        return creerResultatAide(
            "aide_base",
            STATUT_AIDE.INFORMATIONS_MANQUANTES,
            raisons,
            manquants,
            verifications
        );
    }


    raisons.push(
        "Le profil indique un agriculteur actif."
    );

    raisons.push(
        "Des DPB peuvent être activés."
    );

    raisons.push(
        "Une surface admissible est renseignée."
    );


    return creerResultatAide(
        "aide_base",
        STATUT_AIDE.A_EXAMINER,
        raisons,
        [],
        [
            "Vérifier le nombre exact de DPB activables.",
            "Vérifier leur valeur individuelle.",
            "Vérifier la surface admissible effectivement détenue."
        ]
    );
}


/* =========================================================
   5. AIDE REDISTRIBUTIVE
========================================================= */

function analyserAideRedistributive() {

    const aideBase =
        analyserAideBase();

    if (
        aideBase.statut ===
        STATUT_AIDE.NON_RETENUE
    ) {

        return creerResultatAide(
            "aide_redistributive",
            STATUT_AIDE.NON_RETENUE,
            [],
            [],
            [
                "L'aide redistributive nécessite notamment l'activation d'au moins un DPB ou d'une fraction de DPB."
            ]
        );
    }


    if (
        aideBase.statut ===
        STATUT_AIDE.INFORMATIONS_MANQUANTES
    ) {

        return creerResultatAide(
            "aide_redistributive",
            STATUT_AIDE.INFORMATIONS_MANQUANTES,
            [],
            aideBase.informationsManquantes,
            []
        );
    }


    const surface =
        profilExploitation
            .surfaces
            .surfaceAdmissible;


    return creerResultatAide(
        "aide_redistributive",
        STATUT_AIDE.A_EXAMINER,
        [
            "Au moins un DPB peut être activé.",
            "L'exploitation dispose d'une surface admissible."
        ],
        [],
        [
            "Le paiement porte sur les premiers hectares admissibles dans la limite réglementaire.",
            "Appliquer la transparence lorsqu'il s'agit d'un GAEC total."
        ],
        {
            hectaresPotentiellementConcernes:
                surface !== null
                    ? Math.min(surface, 52)
                    : null
        }
    );
}


/* =========================================================
   6. JEUNE AGRICULTEUR / ACJA
========================================================= */

function verifierQualificationJA() {

    const installation =
        profilExploitation.installation;

    if (
        installation
            .diplomeAgricoleNiveau4OuPlus
        === true
    ) {

        return true;
    }


    if (
        installation.experienceAgricoleMois !== null &&
        installation.experienceAgricoleMois >= 40
    ) {

        return true;
    }


    if (
        installation.diplomeNiveau3OuPlus === true &&
        installation.experienceAgricoleMois !== null &&
        installation.experienceAgricoleMois >= 24
    ) {

        return true;
    }


    if (
        installation.diplomeAgricoleNiveau4OuPlus
            === null &&
        installation.experienceAgricoleMois
            === null &&
        installation.diplomeNiveau3OuPlus
            === null
    ) {

        return null;
    }


    return false;
}


function analyserACJA() {

    const p =
        profilExploitation.installation;

    const actif =
        verifierAgriculteurActif();

    const manquants = [];
    const raisons = [];


    if (actif.inconnu) {

        manquants.push(
            "Statut d'agriculteur actif"
        );
    }


    if (!actif.inconnu && !actif.valide) {

        return creerResultatAide(
            "acja",
            STATUT_AIDE.NON_RETENUE,
            [],
            [],
            [
                "Le critère d'agriculteur actif n'est pas rempli dans le profil."
            ]
        );
    }


    if (p.age === null) {

        manquants.push(
            "Âge du jeune agriculteur"
        );
    }

    else if (p.age > 40) {

        return creerResultatAide(
            "acja",
            STATUT_AIDE.NON_RETENUE,
            [],
            [],
            [
                "L'âge renseigné dépasse la limite prévue pour la définition du jeune agriculteur."
            ]
        );
    }


    if (p.premiereInstallation === null) {

        manquants.push(
            "Première installation"
        );
    }

    else if (
        p.premiereInstallation === false
    ) {

        return creerResultatAide(
            "acja",
            STATUT_AIDE.NON_RETENUE,
            [],
            [],
            [
                "Le profil indique qu'il ne s'agit pas d'une première installation."
            ]
        );
    }


    if (p.anneeInstallation === null) {

        manquants.push(
            "Année d'installation"
        );
    }

    else {

        const anciennete =
            2026 - p.anneeInstallation;

        if (
            anciennete < 0 ||
            anciennete > 5
        ) {

            return creerResultatAide(
                "acja",
                STATUT_AIDE.NON_RETENUE,
                [],
                [],
                [
                    "L'année d'installation renseignée se situe hors de la période de première installation récente utilisée pour cette pré-orientation."
                ]
            );
        }
    }


    const qualification =
        verifierQualificationJA();

    if (qualification === null) {

        manquants.push(
            "Diplôme ou expérience professionnelle agricole"
        );
    }

    else if (qualification === false) {

        return creerResultatAide(
            "acja",
            STATUT_AIDE.NON_RETENUE,
            [],
            [],
            [
                "Les informations renseignées ne permettent pas de satisfaire le critère de diplôme ou d'expérience du jeune agriculteur."
            ]
        );
    }


    const dpb =
        profilExploitation
            .dpb
            .nombreDPBActives;

    if (dpb === null) {

        manquants.push(
            "Nombre de DPB activés"
        );
    }

    else if (dpb <= 0) {

        return creerResultatAide(
            "acja",
            STATUT_AIDE.NON_RETENUE,
            [],
            [],
            [
                "Aucun DPB ou fraction de DPB activé n'est renseigné."
            ]
        );
    }


    if (manquants.length > 0) {

        return creerResultatAide(
            "acja",
            STATUT_AIDE.INFORMATIONS_MANQUANTES,
            raisons,
            manquants,
            []
        );
    }


    raisons.push(
        "Âge compatible avec la définition du jeune agriculteur."
    );

    raisons.push(
        "Première installation récente."
    );

    raisons.push(
        "Condition de diplôme ou d'expérience potentiellement satisfaite."
    );

    raisons.push(
        "Au moins un DPB peut être activé."
    );


    return creerResultatAide(
        "acja",
        STATUT_AIDE.A_EXAMINER,
        raisons,
        [],
        [
            "Pour une société ou un GAEC, vérifier les critères au niveau du ou des associés concernés.",
            "Vérifier le nombre d'annuités ACJA déjà perçues."
        ]
    );
}


/* =========================================================
   7. ÉCORÉGIME
========================================================= */

function analyserEcoregime() {

    const actif =
        verifierAgriculteurActif();

    const raisons = [];
    const manquants = [];
    const voies = [];


    if (actif.inconnu) {

        manquants.push(
            "Statut d'agriculteur actif"
        );
    }

    else if (!actif.valide) {

        return creerResultatAide(
            "ecoregime",
            STATUT_AIDE.NON_RETENUE,
            [],
            [],
            [
                "Le profil n'est pas renseigné comme agriculteur actif."
            ]
        );
    }


    const dpb =
        profilExploitation
            .dpb
            .nombreDPBActives;

    if (dpb === null) {

        manquants.push(
            "DPB activés"
        );
    }

    else if (dpb <= 0) {

        return creerResultatAide(
            "ecoregime",
            STATUT_AIDE.NON_RETENUE,
            [],
            [],
            [
                "L'accès à l'écorégime nécessite de disposer de DPB."
            ]
        );
    }


    /* -----------------------------------------------------
       VOIE CERTIFICATION
    ----------------------------------------------------- */

    const env =
        profilExploitation.environnement;

    if (
        env.agricultureBiologique === true
    ) {

        voies.push({
            voie: "certification",
            niveau: "agriculture_biologique",
            raison:
                "Exploitation déclarée en agriculture biologique."
        });
    }

    else if (
        env.hveRenovee === true
    ) {

        voies.push({
            voie: "certification",
            niveau: "superieur",
            raison:
                "Certification HVE rénovée renseignée."
        });
    }

    else if (
        env.certificationCE2Plus === true
    ) {

        voies.push({
            voie: "certification",
            niveau: "base",
            raison:
                "Certification CE2+ renseignée."
        });
    }


    /* -----------------------------------------------------
       VOIE BIODIVERSITÉ
    ----------------------------------------------------- */

    const ratioIAE =
        profilExploitation
            .ecoregime
            .pourcentageIAEEtJacheresSAU;

    if (ratioIAE !== null) {

        if (ratioIAE >= 10) {

            voies.push({
                voie: "biodiversite",
                niveau: "superieur",
                raison:
                    "Au moins 10 % d'IAE ou de jachères sur la SAU."
            });
        }

        else if (ratioIAE >= 7) {

            voies.push({
                voie: "biodiversite",
                niveau: "base",
                raison:
                    "Au moins 7 % d'IAE ou de jachères sur la SAU."
            });
        }
    }


    /* -----------------------------------------------------
       VOIE DES PRATIQUES
    ----------------------------------------------------- */

    const surfaces =
        profilExploitation.surfaces;

    const eco =
        profilExploitation.ecoregime;


    let pratiquesApplicables = false;
    let pratiquesBloquees = false;
    let pratiquesInconnues = false;


    if (
        surfaces.surfaceAdmissible !== null &&
        surfaces.surfaceAdmissible > 0
    ) {

        /* Terres arables */

        if (
            surfaces.terresArables !== null &&
            (
                surfaces.terresArables /
                surfaces.surfaceAdmissible
            ) >= 0.05
        ) {

            pratiquesApplicables = true;

            if (
                eco.diversificationCulturesRespectee
                === false
            ) {
                pratiquesBloquees = true;
            }

            else if (
                eco.diversificationCulturesRespectee
                === null
            ) {
                pratiquesInconnues = true;
            }
        }


        /* Prairies permanentes */

        if (
            surfaces.prairiesPermanentes !== null &&
            (
                surfaces.prairiesPermanentes /
                surfaces.surfaceAdmissible
            ) >= 0.05
        ) {

            pratiquesApplicables = true;

            if (
                eco.pourcentagePrairiesNonLabourees
                === null
            ) {

                pratiquesInconnues = true;
            }

            else if (
                eco.pourcentagePrairiesNonLabourees
                < 80
            ) {

                pratiquesBloquees = true;
            }
        }


        /* Cultures permanentes */

        if (
            surfaces.culturesPermanentes !== null &&
            (
                surfaces.culturesPermanentes /
                surfaces.surfaceAdmissible
            ) >= 0.05
        ) {

            pratiquesApplicables = true;

            if (
                eco.pourcentageInterRangsCouverts
                === null
            ) {

                pratiquesInconnues = true;
            }

            else if (
                eco.pourcentageInterRangsCouverts
                < 75
            ) {

                pratiquesBloquees = true;
            }
        }
    }


    if (
        pratiquesApplicables &&
        !pratiquesBloquees &&
        !pratiquesInconnues
    ) {

        voies.push({
            voie: "pratiques",
            niveau: "a_determiner",
            raison:
                "Les critères de base renseignés pour les catégories de surfaces ne présentent pas de blocage identifié."
        });
    }


    /* -----------------------------------------------------
       BONUS HAIES
    ----------------------------------------------------- */

    let bonusHaies = false;

    if (
        env.certificationGestionDurableHaies === true &&
        surfaces.pourcentageHaiesSAU !== null &&
        surfaces.pourcentageHaiesSAU >= 6
    ) {

        if (
            surfaces.terresArables === 0 ||
            (
                surfaces
                    .pourcentageHaiesTerresArables
                !== null &&
                surfaces
                    .pourcentageHaiesTerresArables
                >= 6
            )
        ) {

            bonusHaies = true;
        }
    }


    if (
        voies.length === 0 &&
        manquants.length === 0
    ) {

        return creerResultatAide(
            "ecoregime",
            STATUT_AIDE.INFORMATIONS_MANQUANTES,
            [],
            [
                "Informations nécessaires pour déterminer au moins une voie d'accès à l'écorégime"
            ],
            [
                "Vérifier la voie des pratiques.",
                "Vérifier les certifications environnementales.",
                "Vérifier le pourcentage d'IAE et de jachères."
            ]
        );
    }


    if (manquants.length > 0) {

        return creerResultatAide(
            "ecoregime",
            STATUT_AIDE.INFORMATIONS_MANQUANTES,
            [],
            manquants,
            [],
            {
                voiesPotentielles: voies,
                bonusHaies: bonusHaies
            }
        );
    }


    return creerResultatAide(
        "ecoregime",
        STATUT_AIDE.A_EXAMINER,
        [
            "Au moins une voie d'accès potentielle a été identifiée."
        ],
        [],
        [
            "Les exigences complètes de la voie retenue doivent être vérifiées.",
            "Les trois voies principales ne sont pas cumulables entre elles."
        ],
        {
            voiesPotentielles: voies,
            bonusHaies: bonusHaies
        }
    );
}


/* =========================================================
   8. AIDE MARAÎCHAGE
========================================================= */

function analyserMaraichage() {

    const maraichage =
        profilExploitation
            .productionsVegetales
            .maraichage;

    if (!maraichage.presente) {

        return creerResultatAide(
            "petit_maraichage",
            STATUT_AIDE.NON_RETENUE,
            [],
            [],
            [
                "Aucune activité de maraîchage n'est renseignée."
            ]
        );
    }


    const actif =
        verifierAgriculteurActif();

    if (actif.inconnu) {

        return creerResultatAide(
            "petit_maraichage",
            STATUT_AIDE.INFORMATIONS_MANQUANTES,
            [],
            [
                "Statut d'agriculteur actif"
            ]
        );
    }


    if (!actif.valide) {

        return creerResultatAide(
            "petit_maraichage",
            STATUT_AIDE.NON_RETENUE
        );
    }


    const surface =
        calculerSurfaceMaraichage();

    const sau =
        profilExploitation.surfaces.sau;


    if (surface < 0.5) {

        return creerResultatAide(
            "petit_maraichage",
            STATUT_AIDE.NON_RETENUE,
            [],
            [],
            [
                "La surface renseignée en légumes frais et petits fruits rouges est inférieure à 0,5 ha."
            ]
        );
    }


    if (sau === null) {

        return creerResultatAide(
            "petit_maraichage",
            STATUT_AIDE.INFORMATIONS_MANQUANTES,
            [],
            [
                "SAU totale"
            ]
        );
    }


    if (sau > 3) {

        return creerResultatAide(
            "petit_maraichage",
            STATUT_AIDE.NON_RETENUE,
            [],
            [],
            [
                "La SAU renseignée dépasse 3 ha."
            ]
        );
    }


    return creerResultatAide(
        "petit_maraichage",
        STATUT_AIDE.A_EXAMINER,
        [
            "Surface de maraîchage supérieure ou égale à 0,5 ha.",
            "SAU inférieure ou égale à 3 ha.",
            "Statut d'agriculteur actif renseigné."
        ],
        [],
        [],
        {
            surfaceMaraichage: surface,
            sau: sau
        }
    );
}


/* =========================================================
   9. LÉGUMINEUSES FOURRAGÈRES
========================================================= */

function analyserLegumineusesFourrageres() {

    const leg =
        profilExploitation
            .productionsVegetales
            .legumineusesFourrageres;

    if (!leg.presente) {

        return creerResultatAide(
            "legumineuses_fourrageres",
            STATUT_AIDE.NON_RETENUE
        );
    }


    const actif =
        verifierAgriculteurActif();

    if (actif.inconnu) {

        return creerResultatAide(
            "legumineuses_fourrageres",
            STATUT_AIDE.INFORMATIONS_MANQUANTES,
            [],
            [
                "Statut d'agriculteur actif"
            ]
        );
    }


    if (!actif.valide) {

        return creerResultatAide(
            "legumineuses_fourrageres",
            STATUT_AIDE.NON_RETENUE
        );
    }


    if (
        leg.surface === null ||
        leg.surface <= 0
    ) {

        return creerResultatAide(
            "legumineuses_fourrageres",
            STATUT_AIDE.INFORMATIONS_MANQUANTES,
            [],
            [
                "Surface en légumineuses fourragères"
            ]
        );
    }


    const ugb =
        profilExploitation.ichn.ugb !== null
            ? profilExploitation.ichn.ugb
            : profilExploitation
                .bovins
                .ugbEligibles;


    const conditionEleveur =
        (
            ugb !== null &&
            ugb >= 5
        ) ||
        leg.contratEleveur === true;


    if (!conditionEleveur) {

        if (
            ugb === null &&
            leg.contratEleveur === null
        ) {

            return creerResultatAide(
                "legumineuses_fourrageres",
                STATUT_AIDE.INFORMATIONS_MANQUANTES,
                [],
                [
                    "Nombre d'UGB ou présence d'un contrat direct avec un éleveur"
                ]
            );
        }


        return creerResultatAide(
            "legumineuses_fourrageres",
            STATUT_AIDE.NON_RETENUE,
            [],
            [],
            [
                "Le seuil de 5 UGB ou la condition de contrat avec un éleveur n'est pas satisfait dans le profil."
            ]
        );
    }


    return creerResultatAide(
        "legumineuses_fourrageres",
        STATUT_AIDE.A_EXAMINER,
        [
            "Production de légumineuses fourragères renseignée.",
            "Condition liée aux 5 UGB ou au contrat éleveur potentiellement satisfaite."
        ],
        leg.zone === null
            ? ["Zone plaine/piémont ou montagne"]
            : [],
        [
            "Vérifier la composition des mélanges lorsqu'ils existent."
        ]
    );
}


/* =========================================================
   10. BLÉ DUR
========================================================= */

function analyserBleDur() {

    const ble =
        profilExploitation
            .productionsVegetales
            .bleDur;

    if (!ble.presente) {

        return creerResultatAide(
            "ble_dur",
            STATUT_AIDE.NON_RETENUE
        );
    }


    if (
        verifierAgriculteurActif().valide
        !== true
    ) {

        return creerResultatAide(
            "ble_dur",
            STATUT_AIDE.INFORMATIONS_MANQUANTES,
            [],
            [
                "Statut d'agriculteur actif"
            ]
        );
    }


    const territoire =
        profilExploitation
            .general
            .territoire;

    const regions =
        [
            "Occitanie",
            "Provence-Alpes-Côte d’Azur",
            "Provence-Alpes-Côte d'Azur"
        ];


    const zoneEligible =
        regions.includes(territoire.region) ||
        ["Drôme", "Ardèche"].includes(
            territoire.departement
        );


    if (
        territoire.region === null &&
        territoire.departement === null
    ) {

        return creerResultatAide(
            "ble_dur",
            STATUT_AIDE.INFORMATIONS_MANQUANTES,
            [],
            [
                "Région ou département"
            ]
        );
    }


    if (!zoneEligible) {

        return creerResultatAide(
            "ble_dur",
            STATUT_AIDE.NON_RETENUE,
            [],
            [],
            [
                "La localisation renseignée ne correspond pas à une zone de production mentionnée dans le guide."
            ]
        );
    }


    if (ble.contratCollecteur !== true) {

        if (ble.contratCollecteur === null) {

            return creerResultatAide(
                "ble_dur",
                STATUT_AIDE.INFORMATIONS_MANQUANTES,
                [],
                [
                    "Contrat annuel avec un collecteur"
                ]
            );
        }


        return creerResultatAide(
            "ble_dur",
            STATUT_AIDE.NON_RETENUE,
            [],
            [],
            [
                "Aucun contrat annuel de livraison avec un collecteur n'est renseigné."
            ]
        );
    }


    return creerResultatAide(
        "ble_dur",
        STATUT_AIDE.A_EXAMINER,
        [
            "Production de blé dur située dans une zone mentionnée dans le guide.",
            "Contrat collecteur renseigné."
        ]
    );
}


/* =========================================================
   11. AIDE BOVINE — HEXAGONE
========================================================= */

function analyserBovins() {

    const bovins =
        profilExploitation.bovins;

    if (!bovins.present) {

        return creerResultatAide(
            "bovins_hexagone",
            STATUT_AIDE.NON_RETENUE
        );
    }


    if (
        profilExploitation
            .general
            .territoire
            .zone === "Corse"
    ) {

        return creerResultatAide(
            "bovins_hexagone",
            STATUT_AIDE.NON_RETENUE,
            [],
            [],
            [
                "Cette fiche concerne l'aide bovine de l'Hexagone. La Corse dispose de règles spécifiques."
            ]
        );
    }


    const actif =
        verifierAgriculteurActif();

    if (!actif.valide) {

        return creerResultatAide(
            "bovins_hexagone",
            actif.inconnu
                ? STATUT_AIDE.INFORMATIONS_MANQUANTES
                : STATUT_AIDE.NON_RETENUE,
            [],
            actif.inconnu
                ? ["Statut d'agriculteur actif"]
                : []
        );
    }


    const ugb =
        bovins.ugbEligibles;


    if (ugb === null) {

        return creerResultatAide(
            "bovins_hexagone",
            STATUT_AIDE.INFORMATIONS_MANQUANTES,
            [],
            [
                "Nombre d'UGB bovines éligibles"
            ]
        );
    }


    if (ugb < 5) {

        return creerResultatAide(
            "bovins_hexagone",
            STATUT_AIDE.NON_RETENUE,
            [],
            [],
            [
                "Le profil comporte moins de 5 UGB bovines."
            ]
        );
    }


    const manquants = [];


    if (
        bovins.animauxDetenus6Mois === null
    ) {

        manquants.push(
            "Respect de la durée de détention"
        );
    }


    if (
        bovins.identificationConforme === null
    ) {

        manquants.push(
            "Conformité de l'identification des animaux"
        );
    }


    return creerResultatAide(
        "bovins_hexagone",
        STATUT_AIDE.A_EXAMINER,
        [
            "Au moins 5 UGB bovines sont renseignées."
        ],
        manquants,
        [
            "Déterminer les UGB relevant du niveau supérieur.",
            "Déterminer les UGB relevant du niveau de base.",
            "Appliquer les plafonds réglementaires et la surface fourragère."
        ],
        {
            ugbPotentielles: ugb
        }
    );
}


/* =========================================================
   12. AIDE OVINE — HEXAGONE
========================================================= */

function analyserOvins() {

    const ovins =
        profilExploitation.ovins;

    if (!ovins.present) {

        return creerResultatAide(
            "ovins_hexagone",
            STATUT_AIDE.NON_RETENUE
        );
    }


    if (
        profilExploitation
            .general
            .territoire
            .zone === "Corse"
    ) {

        return creerResultatAide(
            "ovins_hexagone",
            STATUT_AIDE.NON_RETENUE,
            [],
            [],
            [
                "La Corse dispose d'un dispositif spécifique pour les petits ruminants."
            ]
        );
    }


    const actif =
        verifierAgriculteurActif();

    if (!actif.valide) {

        return creerResultatAide(
            "ovins_hexagone",
            actif.inconnu
                ? STATUT_AIDE.INFORMATIONS_MANQUANTES
                : STATUT_AIDE.NON_RETENUE,
            [],
            actif.inconnu
                ? ["Statut d'agriculteur actif"]
                : []
        );
    }


    const brebis =
        ovins.nombreBrebisEligibles !== null
            ? ovins.nombreBrebisEligibles
            : ovins.nombreBrebis;


    if (brebis === null) {

        return creerResultatAide(
            "ovins_hexagone",
            STATUT_AIDE.INFORMATIONS_MANQUANTES,
            [],
            [
                "Nombre de brebis"
            ]
        );
    }


    if (brebis < 50) {

        return creerResultatAide(
            "ovins_hexagone",
            STATUT_AIDE.NON_RETENUE,
            [],
            [],
            [
                "Le nombre de brebis renseigné est inférieur au seuil de 50."
            ]
        );
    }


    const ratio =
        calculerRatioProductiviteOvine();


    return creerResultatAide(
        "ovins_hexagone",
        STATUT_AIDE.A_EXAMINER,
        [
            "Le seuil de 50 brebis est atteint."
        ],
        [],
        [
            "Vérifier la détention pendant la période réglementaire.",
            "Vérifier l'identification des animaux.",
            "Vérifier le ratio de productivité lorsque l'exploitation n'est pas un nouveau producteur."
        ],
        {
            brebisPotentielles: brebis,

            ratioProductivite: ratio,

            nouveauProducteur:
                ovins.nouveauProducteur
        }
    );
}


/* =========================================================
   13. AIDE CAPRINE — HEXAGONE
========================================================= */

function analyserCaprins() {

    const caprins =
        profilExploitation.caprins;

    if (!caprins.present) {

        return creerResultatAide(
            "caprins_hexagone",
            STATUT_AIDE.NON_RETENUE
        );
    }


    if (
        profilExploitation
            .general
            .territoire
            .zone === "Corse"
    ) {

        return creerResultatAide(
            "caprins_hexagone",
            STATUT_AIDE.NON_RETENUE,
            [],
            [],
            [
                "La Corse dispose d'un dispositif spécifique pour les petits ruminants."
            ]
        );
    }


    const actif =
        verifierAgriculteurActif();

    if (!actif.valide) {

        return creerResultatAide(
            "caprins_hexagone",
            actif.inconnu
                ? STATUT_AIDE.INFORMATIONS_MANQUANTES
                : STATUT_AIDE.NON_RETENUE,
            [],
            actif.inconnu
                ? ["Statut d'agriculteur actif"]
                : []
        );
    }


    const chevres =
        caprins.nombreChevresEligibles !== null
            ? caprins.nombreChevresEligibles
            : caprins.nombreChevres;


    if (chevres === null) {

        return creerResultatAide(
            "caprins_hexagone",
            STATUT_AIDE.INFORMATIONS_MANQUANTES,
            [],
            [
                "Nombre de chèvres"
            ]
        );
    }


    if (chevres < 25) {

        return creerResultatAide(
            "caprins_hexagone",
            STATUT_AIDE.NON_RETENUE,
            [],
            [],
            [
                "Le nombre de chèvres renseigné est inférieur au seuil de 25."
            ]
        );
    }


    return creerResultatAide(
        "caprins_hexagone",
        STATUT_AIDE.A_EXAMINER,
        [
            "Le seuil minimal de 25 chèvres est atteint."
        ],
        [],
        [
            "Vérifier la durée de détention.",
            "Vérifier l'identification des animaux.",
            "Appliquer le plafond de 400 chèvres, avec transparence GAEC le cas échéant."
        ],
        {
            chevresPotentielles:
                Math.min(chevres, 400)
        }
    );
}


/* =========================================================
   14. VEAUX SOUS LA MÈRE / BIO
========================================================= */

function analyserVeauxQualite() {

    const veaux =
        profilExploitation.veauxQualite;

    if (!veaux.present) {

        return creerResultatAide(
            "veaux_qualite",
            STATUT_AIDE.NON_RETENUE
        );
    }


    const certification =
        (
            veaux.labelRouge === true ||
            veaux.igpRoseePyreneesCatalanes
                === true ||
            veaux.agricultureBiologique
                === true
        );


    if (!certification) {

        if (
            veaux.labelRouge === null &&
            veaux.igpRoseePyreneesCatalanes
                === null &&
            veaux.agricultureBiologique
                === null
        ) {

            return creerResultatAide(
                "veaux_qualite",
                STATUT_AIDE.INFORMATIONS_MANQUANTES,
                [],
                [
                    "Certification ou signe de qualité des veaux"
                ]
            );
        }


        return creerResultatAide(
            "veaux_qualite",
            STATUT_AIDE.NON_RETENUE
        );
    }


    if (
        veaux.nombreVeauxEligibles === null
    ) {

        return creerResultatAide(
            "veaux_qualite",
            STATUT_AIDE.INFORMATIONS_MANQUANTES,
            [],
            [
                "Nombre de veaux potentiellement éligibles"
            ]
        );
    }


    return creerResultatAide(
        "veaux_qualite",
        STATUT_AIDE.A_EXAMINER,
        [
            "Une certification ou un signe de qualité compatible est renseigné."
        ],
        [],
        [
            "Vérifier les critères d'âge.",
            "Vérifier la détention minimale.",
            "Vérifier la période d'abattage ou de vente.",
            "Vérifier l'identification des animaux."
        ],
        {
            nombreVeaux:
                veaux.nombreVeauxEligibles
        }
    );
}


/* =========================================================
   15. ANALYSE GLOBALE
========================================================= */

function analyserToutesLesAides() {

    const resultats = [

        analyserAideBase(),

        analyserAideRedistributive(),

        analyserACJA(),

        analyserEcoregime(),

        analyserMaraichage(),

        analyserLegumineusesFourrageres(),

        analyserBleDur(),

        analyserBovins(),

        analyserVeauxQualite(),

        analyserOvins(),

        analyserCaprins()

    ];


    return resultats;
}


/* =========================================================
   16. FILTRES POUR L'INTERFACE
========================================================= */

function obtenirAidesAExaminer() {

    return analyserToutesLesAides()
        .filter(
            resultat =>
                resultat.statut ===
                STATUT_AIDE.A_EXAMINER
        );
}


function obtenirAidesAvecInformationsManquantes() {

    return analyserToutesLesAides()
        .filter(
            resultat =>
                resultat.statut ===
                STATUT_AIDE
                    .INFORMATIONS_MANQUANTES
        );
}


function obtenirAidesNonRetenues() {

    return analyserToutesLesAides()
        .filter(
            resultat =>
                resultat.statut ===
                STATUT_AIDE.NON_RETENUE
        );
}


/* =========================================================
   17. TEST RAPIDE DANS LA CONSOLE
========================================================= */

function testerOrientation() {

    const resultats =
        analyserToutesLesAides();

    console.table(
        resultats.map(
            resultat => ({
                aide:
                    resultat.nom,

                statut:
                    resultat.statut,

                manquants:
                    resultat
                        .informationsManquantes
                        .join(", ")
            })
        )
    );

    return resultats;
}
