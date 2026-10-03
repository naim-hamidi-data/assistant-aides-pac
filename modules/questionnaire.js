/* =========================================================
   ASSISTANT & SIMULATEUR D'AIDES PAC
   QUESTIONNAIRE DYNAMIQUE
========================================================= */

let etapeQuestionnaire = 0;


/* =========================================================
   OUTILS
========================================================= */

function lireValeurProfil(chemin) {

    return lireProfil(chemin);
}


function convertirValeur(valeur, type) {

    if (valeur === "") {
        return null;
    }

    if (type === "number") {

        const nombre = Number(valeur);

        return Number.isNaN(nombre)
            ? null
            : nombre;
    }

    if (valeur === "true") {
        return true;
    }

    if (valeur === "false") {
        return false;
    }

    return valeur;
}


function afficherValeur(valeur) {

    if (
        valeur === null ||
        valeur === undefined
    ) {
        return "";
    }

    return valeur;
}


/* =========================================================
   CONDITIONS D'AFFICHAGE
========================================================= */

function estGAEC() {

    return (
        lireProfil(
            "general.statutJuridique"
        ) === "GAEC"
    );
}


function aDPB() {

    return (
        lireProfil(
            "dpb.detientDPB"
        ) === true
    );
}


function aMaraichage() {

    return (
        lireProfil(
            "productionsVegetales.maraichage.presente"
        ) === true
    );
}


function aLegumineusesFourrageres() {

    return (
        lireProfil(
            "productionsVegetales.legumineusesFourrageres.presente"
        ) === true
    );
}


function aBleDur() {

    return (
        lireProfil(
            "productionsVegetales.bleDur.presente"
        ) === true
    );
}


function aBovins() {

    return (
        lireProfil(
            "bovins.present"
        ) === true
    );
}


function aVeauxQualite() {

    return (
        lireProfil(
            "veauxQualite.present"
        ) === true
    );
}


function aOvins() {

    return (
        lireProfil(
            "ovins.present"
        ) === true
    );
}


function aCaprins() {

    return (
        lireProfil(
            "caprins.present"
        ) === true
    );
}


function premiereInstallation() {

    return (
        lireProfil(
            "installation.premiereInstallation"
        ) === true
    );
}


function terresArablesSignificatives() {

    const ta =
        lireProfil(
            "surfaces.terresArables"
        );

    const surface =
        lireProfil(
            "surfaces.surfaceAdmissible"
        );


    if (
        ta === null ||
        surface === null ||
        surface <= 0
    ) {
        return false;
    }


    return (
        ta / surface
    ) >= 0.05;
}


function prairiesSignificatives() {

    const pp =
        lireProfil(
            "surfaces.prairiesPermanentes"
        );

    const surface =
        lireProfil(
            "surfaces.surfaceAdmissible"
        );


    if (
        pp === null ||
        surface === null ||
        surface <= 0
    ) {
        return false;
    }


    return (
        pp / surface
    ) >= 0.05;
}


function culturesPermanentesSignificatives() {

    const cp =
        lireProfil(
            "surfaces.culturesPermanentes"
        );

    const surface =
        lireProfil(
            "surfaces.surfaceAdmissible"
        );


    if (
        cp === null ||
        surface === null ||
        surface <= 0
    ) {
        return false;
    }


    return (
        cp / surface
    ) >= 0.05;
}


/* =========================================================
   QUESTIONS
========================================================= */

const ETAPES_QUESTIONNAIRE = [

    /* =====================================================
       ÉTAPE 1
    ===================================================== */

    {
        titre:
            "Votre exploitation",

        sousTitre:
            "Commençons par quelques informations générales.",

        questions: [

            {
                id: "territoire",
                chemin:
                    "general.territoire.zone",

                label:
                    "Où se situe principalement votre exploitation ?",

                type: "select",

                options: [
                    {
                        valeur: "",
                        texte:
                            "Sélectionner"
                    },
                    {
                        valeur:
                            "Hexagone",
                        texte:
                            "France métropolitaine hors Corse"
                    },
                    {
                        valeur:
                            "Corse",
                        texte:
                            "Corse"
                    },
                    {
                        valeur:
                            "Outre-mer",
                        texte:
                            "Outre-mer"
                    }
                ]
            },


            {
                id: "region",
                chemin:
                    "general.territoire.region",

                label:
                    "Région",

                type: "text",

                placeholder:
                    "Ex. Occitanie"
            },


            {
                id: "departement",
                chemin:
                    "general.territoire.departement",

                label:
                    "Département",

                type: "text",

                placeholder:
                    "Ex. Haute-Garonne"
            },


            {
                id: "statut",
                chemin:
                    "general.statutJuridique",

                label:
                    "Statut juridique",

                type: "select",

                refreshOnChange: true,

                options: [
                    {
                        valeur: "",
                        texte:
                            "Sélectionner"
                    },
                    {
                        valeur:
                            "individuel",
                        texte:
                            "Exploitant individuel"
                    },
                    {
                        valeur:
                            "GAEC",
                        texte:
                            "GAEC"
                    },
                    {
                        valeur:
                            "EARL",
                        texte:
                            "EARL"
                    },
                    {
                        valeur:
                            "SCEA",
                        texte:
                            "SCEA"
                    },
                    {
                        valeur:
                            "SAS",
                        texte:
                            "SAS"
                    },
                    {
                        valeur:
                            "SARL",
                        texte:
                            "SARL"
                    },
                    {
                        valeur:
                            "SA",
                        texte:
                            "SA"
                    },
                    {
                        valeur:
                            "autre",
                        texte:
                            "Autre"
                    }
                ]
            },


            {
                id:
                    "gaecTotal",

                chemin:
                    "general.gaecTotal",

                label:
                    "S'agit-il d'un GAEC total ?",

                type:
                    "yesno",

                afficherSi:
                    estGAEC
            },


            {
                id:
                    "nombreAssocies",

                chemin:
                    "general.nombreAssocies",

                label:
                    "Nombre d'associés",

                type:
                    "number",

                min: 1,

                afficherSi:
                    estGAEC
            },


            {
                id:
                    "agriculteurActif",

                chemin:
                    "agriculteurActif.statut",

                label:
                    "Savez-vous si le demandeur répond à la définition d'agriculteur actif au sens de la PAC ?",

                type:
                    "select",

                options: [
                    {
                        valeur: "",
                        texte:
                            "Je ne sais pas"
                    },
                    {
                        valeur:
                            "true",
                        texte:
                            "Oui"
                    },
                    {
                        valeur:
                            "false",
                        texte:
                            "Non"
                    }
                ],

                aide:
                    "Nous créerons ensuite un contrôle détaillé du statut d'agriculteur actif."
            }
        ]
    },


    /* =====================================================
       ÉTAPE 2
    ===================================================== */

    {
        titre:
            "Surfaces et DPB",

        sousTitre:
            "Ces données servent notamment aux paiements découplés et à l'écorégime.",

        questions: [

            {
                chemin:
                    "surfaces.sau",

                label:
                    "SAU totale de l'exploitation",

                type:
                    "number",

                suffixe:
                    "ha",

                min: 0,
                step: 0.01
            },


            {
                chemin:
                    "surfaces.surfaceAdmissible",

                label:
                    "Surface admissible aux aides PAC",

                type:
                    "number",

                suffixe:
                    "ha",

                min: 0,
                step: 0.01
            },


            {
                chemin:
                    "surfaces.terresArables",

                label:
                    "Terres arables",

                type:
                    "number",

                suffixe:
                    "ha",

                min: 0,
                step: 0.01
            },


            {
                chemin:
                    "surfaces.prairiesPermanentes",

                label:
                    "Prairies permanentes",

                type:
                    "number",

                suffixe:
                    "ha",

                min: 0,
                step: 0.01
            },


            {
                chemin:
                    "surfaces.culturesPermanentes",

                label:
                    "Cultures permanentes",

                type:
                    "number",

                suffixe:
                    "ha",

                min: 0,
                step: 0.01
            },


            {
                chemin:
                    "dpb.detientDPB",

                label:
                    "L'exploitation détient-elle des DPB ?",

                type:
                    "yesno",

                refreshOnChange:
                    true
            },


            {
                chemin:
                    "dpb.nombreDPB",

                label:
                    "Nombre de DPB détenus",

                type:
                    "number",

                min: 0,

                afficherSi:
                    aDPB
            },


            {
                chemin:
                    "dpb.nombreDPBActives",

                label:
                    "Nombre de DPB activés ou pouvant être activés",

                type:
                    "number",

                min: 0,

                afficherSi:
                    aDPB
            },


            {
                chemin:
                    "dpb.valeurMoyenneDPB",

                label:
                    "Valeur moyenne de vos DPB",

                type:
                    "number",

                suffixe:
                    "€ / DPB",

                min: 0,
                step: 0.01,

                afficherSi:
                    aDPB,

                aide:
                    "Laissez vide si vous ne connaissez pas cette valeur."
            }
        ]
    },


    /* =====================================================
       ÉTAPE 3
    ===================================================== */

    {
        titre:
            "Productions végétales",

        sousTitre:
            "Les questions suivantes apparaissent uniquement pour les productions concernées.",

        questions: [

            /* MARAÎCHAGE */

            {
                chemin:
                    "productionsVegetales.maraichage.presente",

                label:
                    "Produisez-vous des légumes frais ou petits fruits rouges ?",

                type:
                    "yesno",

                refreshOnChange:
                    true
            },


            {
                chemin:
                    "productionsVegetales.maraichage.surfaceLegumesFrais",

                label:
                    "Surface en légumes frais",

                type:
                    "number",

                suffixe:
                    "ha",

                min: 0,
                step: 0.01,

                afficherSi:
                    aMaraichage
            },


            {
                chemin:
                    "productionsVegetales.maraichage.surfacePetitsFruitsRouges",

                label:
                    "Surface en petits fruits rouges",

                type:
                    "number",

                suffixe:
                    "ha",

                min: 0,
                step: 0.01,

                afficherSi:
                    aMaraichage
            },


            /* LÉGUMINEUSES FOURRAGÈRES */

            {
                chemin:
                    "productionsVegetales.legumineusesFourrageres.presente",

                label:
                    "Cultivez-vous des légumineuses fourragères ?",

                type:
                    "yesno",

                refreshOnChange:
                    true
            },


            {
                chemin:
                    "productionsVegetales.legumineusesFourrageres.surface",

                label:
                    "Surface en légumineuses fourragères",

                type:
                    "number",

                suffixe:
                    "ha",

                min: 0,
                step: 0.01,

                afficherSi:
                    aLegumineusesFourrageres
            },


            {
                chemin:
                    "productionsVegetales.legumineusesFourrageres.zone",

                label:
                    "Dans quelle zone se situent ces surfaces ?",

                type:
                    "select",

                afficherSi:
                    aLegumineusesFourrageres,

                options: [
                    {
                        valeur: "",
                        texte:
                            "Je ne sais pas"
                    },
                    {
                        valeur:
                            "plaine_piemont",
                        texte:
                            "Plaine ou piémont"
                    },
                    {
                        valeur:
                            "montagne",
                        texte:
                            "Montagne ou haute montagne"
                    }
                ]
            },


            {
                chemin:
                    "ichn.ugb",

                label:
                    "Nombre total d'UGB détenues sur l'exploitation",

                type:
                    "number",

                min: 0,
                step: 0.1,

                afficherSi:
                    aLegumineusesFourrageres
            },


            {
                chemin:
                    "productionsVegetales.legumineusesFourrageres.contratEleveur",

                label:
                    "Avez-vous un contrat direct avec un éleveur détenant au moins 5 UGB ?",

                type:
                    "yesno",

                afficherSi:
                    aLegumineusesFourrageres
            },


            /* BLÉ DUR */

            {
                chemin:
                    "productionsVegetales.bleDur.presente",

                label:
                    "Cultivez-vous du blé dur ?",

                type:
                    "yesno",

                refreshOnChange:
                    true
            },


            {
                chemin:
                    "productionsVegetales.bleDur.surface",

                label:
                    "Surface en blé dur",

                type:
                    "number",

                suffixe:
                    "ha",

                min: 0,
                step: 0.01,

                afficherSi:
                    aBleDur
            },


            {
                chemin:
                    "productionsVegetales.bleDur.contratCollecteur",

                label:
                    "Disposez-vous d'un contrat annuel de livraison avec un collecteur ?",

                type:
                    "yesno",

                afficherSi:
                    aBleDur
            }
        ]
    },


    /* =====================================================
       ÉTAPE 4
    ===================================================== */

    {
        titre:
            "Élevage",

        sousTitre:
            "Sélectionnez uniquement les ateliers présents sur l'exploitation.",

        questions: [

            /* BOVINS */

            {
                chemin:
                    "bovins.present",

                label:
                    "Avez-vous un atelier bovin ?",

                type:
                    "yesno",

                refreshOnChange:
                    true
            },


            {
                chemin:
                    "bovins.ugbEligibles",

                label:
                    "Nombre estimé d'UGB bovines éligibles",

                type:
                    "number",

                min: 0,
                step: 0.1,

                afficherSi:
                    aBovins
            },


            {
                chemin:
                    "bovins.ugbNiveauSuperieur",

                label:
                    "UGB relevant potentiellement du niveau supérieur",

                type:
                    "number",

                min: 0,
                step: 0.1,

                afficherSi:
                    aBovins,

                aide:
                    "Laissez vide si vous ne savez pas encore les déterminer."
            },


            {
                chemin:
                    "bovins.ugbNiveauBase",

                label:
                    "UGB relevant potentiellement du niveau de base",

                type:
                    "number",

                min: 0,
                step: 0.1,

                afficherSi:
                    aBovins
            },


            {
                chemin:
                    "surfaces.surfaceFourragere",

                label:
                    "Surface fourragère",

                type:
                    "number",

                suffixe:
                    "ha",

                min: 0,
                step: 0.01,

                afficherSi:
                    aBovins
            },


            {
                chemin:
                    "bovins.animauxDetenus6Mois",

                label:
                    "Les animaux concernés respectent-ils la durée de détention requise ?",

                type:
                    "yesno",

                afficherSi:
                    aBovins
            },


            {
                chemin:
                    "bovins.identificationConforme",

                label:
                    "Les animaux sont-ils correctement identifiés et enregistrés ?",

                type:
                    "yesno",

                afficherSi:
                    aBovins
            },


            /* VEAUX */

            {
                chemin:
                    "veauxQualite.present",

                label:
                    "Produisez-vous des veaux sous la mère sous signe de qualité ou des veaux bio ?",

                type:
                    "yesno",

                refreshOnChange:
                    true
            },


            {
                chemin:
                    "veauxQualite.nombreVeauxEligibles",

                label:
                    "Nombre de veaux potentiellement éligibles",

                type:
                    "number",

                min: 0,

                afficherSi:
                    aVeauxQualite
            },


            {
                chemin:
                    "veauxQualite.labelRouge",

                label:
                    "Production sous Label rouge",

                type:
                    "yesno",

                afficherSi:
                    aVeauxQualite
            },


            {
                chemin:
                    "veauxQualite.igpRoseePyreneesCatalanes",

                label:
                    "Production sous IGP Rosée des Pyrénées Catalanes",

                type:
                    "yesno",

                afficherSi:
                    aVeauxQualite
            },


            {
                chemin:
                    "veauxQualite.agricultureBiologique",

                label:
                    "Production de veaux en agriculture biologique",

                type:
                    "yesno",

                afficherSi:
                    aVeauxQualite
            },


            /* OVINS */

            {
                chemin:
                    "ovins.present",

                label:
                    "Avez-vous un atelier ovin ?",

                type:
                    "yesno",

                refreshOnChange:
                    true
            },


            {
                chemin:
                    "ovins.nombreBrebis",

                label:
                    "Nombre de brebis",

                type:
                    "number",

                min: 0,

                afficherSi:
                    aOvins
            },


            {
                chemin:
                    "ovins.nombreAgneauxVendusNMoins1",

                label:
                    "Nombre d'agneaux vendus l'année précédente",

                type:
                    "number",

                min: 0,

                afficherSi:
                    aOvins
            },


            {
                chemin:
                    "ovins.nouveauProducteur",

                label:
                    "S'agit-il d'un nouvel atelier ovin depuis moins de 3 ans ?",

                type:
                    "yesno",

                afficherSi:
                    aOvins
            },


            /* CAPRINS */

            {
                chemin:
                    "caprins.present",

                label:
                    "Avez-vous un atelier caprin ?",

                type:
                    "yesno",

                refreshOnChange:
                    true
            },


            {
                chemin:
                    "caprins.nombreChevres",

                label:
                    "Nombre de chèvres",

                type:
                    "number",

                min: 0,

                afficherSi:
                    aCaprins
            }
        ]
    },


    /* =====================================================
       ÉTAPE 5
    ===================================================== */

    {
        titre:
            "Installation et écorégime",

        sousTitre:
            "Dernières informations avant l'analyse.",

        questions: [

            /* JA */

            {
                chemin:
                    "installation.premiereInstallation",

                label:
                    "Êtes-vous dans le cadre d'une première installation ?",

                type:
                    "yesno",

                refreshOnChange:
                    true
            },


            {
                chemin:
                    "installation.age",

                label:
                    "Âge de l'exploitant ou de l'associé concerné",

                type:
                    "number",

                min: 18,
                max: 100,

                afficherSi:
                    premiereInstallation
            },


            {
                chemin:
                    "installation.anneeInstallation",

                label:
                    "Année de première installation",

                type:
                    "number",

                min: 1900,
                max: 2026,

                afficherSi:
                    premiereInstallation
            },


            {
                chemin:
                    "installation.diplomeAgricoleNiveau4OuPlus",

                label:
                    "Diplôme, titre ou certificat agricole de niveau 4 ou supérieur ?",

                type:
                    "yesno",

                afficherSi:
                    premiereInstallation
            },


            {
                chemin:
                    "installation.diplomeNiveau3OuPlus",

                label:
                    "Diplôme de niveau 3 ou supérieur, quelle que soit la spécialité ?",

                type:
                    "yesno",

                afficherSi:
                    premiereInstallation
            },


            {
                chemin:
                    "installation.experienceAgricoleMois",

                label:
                    "Expérience professionnelle en production agricole",

                type:
                    "number",

                suffixe:
                    "mois",

                min: 0,

                afficherSi:
                    premiereInstallation
            },


            /* CERTIFICATIONS */

            {
                chemin:
                    "environnement.agricultureBiologique",

                label:
                    "L'ensemble de l'exploitation est-il certifié en agriculture biologique ?",

                type:
                    "yesno"
            },


            {
                chemin:
                    "environnement.hveRenovee",

                label:
                    "L'exploitation dispose-t-elle de la certification HVE rénovée ?",

                type:
                    "yesno"
            },


            {
                chemin:
                    "environnement.certificationCE2Plus",

                label:
                    "L'exploitation dispose-t-elle d'une certification CE2+ reconnue ?",

                type:
                    "yesno"
            },


            /* BIODIVERSITÉ */

            {
                chemin:
                    "ecoregime.pourcentageIAEEtJacheresSAU",

                label:
                    "Part d'IAE et de jachères dans la SAU",

                type:
                    "number",

                suffixe:
                    "%",

                min: 0,
                max: 100,
                step: 0.01
            },


            /* PRATIQUES */

            {
                chemin:
                    "ecoregime.diversificationCulturesRespectee",

                label:
                    "La diversification des cultures atteint-elle le niveau requis ?",

                type:
                    "yesno",

                afficherSi:
                    terresArablesSignificatives
            },


            {
                chemin:
                    "ecoregime.pourcentagePrairiesNonLabourees",

                label:
                    "Part des prairies permanentes non labourées",

                type:
                    "number",

                suffixe:
                    "%",

                min: 0,
                max: 100,

                afficherSi:
                    prairiesSignificatives
            },


            {
                chemin:
                    "ecoregime.pourcentageInterRangsCouverts",

                label:
                    "Part des inter-rangs couverts en cultures permanentes",

                type:
                    "number",

                suffixe:
                    "%",

                min: 0,
                max: 100,

                afficherSi:
                    culturesPermanentesSignificatives
            },


            /* HAIES */

            {
                chemin:
                    "environnement.certificationGestionDurableHaies",

                label:
                    "Disposez-vous d'une certification reconnue de gestion durable des haies ?",

                type:
                    "yesno"
            },


            {
                chemin:
                    "surfaces.pourcentageHaiesSAU",

                label:
                    "Part de haies sur la SAU admissible",

                type:
                    "number",

                suffixe:
                    "%",

                min: 0,
                max: 100,
                step: 0.01
            },


            {
                chemin:
                    "surfaces.pourcentageHaiesTerresArables",

                label:
                    "Part de haies sur les terres arables",

                type:
                    "number",

                suffixe:
                    "%",

                min: 0,
                max: 100,
                step: 0.01,

                afficherSi:
                    terresArablesSignificatives
            }
        ]
    }

];


/* =========================================================
   RENDU DES QUESTIONS
========================================================= */

function creerChampQuestion(question) {

    const valeur =
        lireValeurProfil(
            question.chemin
        );


    const wrapper =
        document.createElement("div");

    wrapper.className =
        "question-item";


    const label =
        document.createElement("label");

    label.className =
        "question-label";

    label.textContent =
        question.label;

    wrapper.appendChild(label);


    /* -----------------------------------------------------
       YES / NO
    ----------------------------------------------------- */

    if (question.type === "yesno") {

        const groupe =
            document.createElement("div");

        groupe.className =
            "yesno-group";


        [
            {
                texte: "Oui",
                valeur: true
            },
            {
                texte: "Non",
                valeur: false
            }
        ].forEach(option => {

            const bouton =
                document.createElement(
                    "button"
                );

            bouton.type =
                "button";

            bouton.className =
                "answer-button";


            if (
                valeur ===
                option.valeur
            ) {

                bouton.classList.add(
                    "selected"
                );
            }


            bouton.textContent =
                option.texte;


            bouton.addEventListener(
                "click",
                () => {

                    modifierProfil(
                        question.chemin,
                        option.valeur
                    );

                    sauvegarderProfilLocalement();

                    afficherEtape();
                }
            );


            groupe.appendChild(
                bouton
            );
        });


        wrapper.appendChild(
            groupe
        );
    }


    /* -----------------------------------------------------
       SELECT
    ----------------------------------------------------- */

    else if (
        question.type === "select"
    ) {

        const select =
            document.createElement(
                "select"
            );


        question.options.forEach(
            option => {

                const opt =
                    document.createElement(
                        "option"
                    );

                opt.value =
                    option.valeur;

                opt.textContent =
                    option.texte;


                if (
                    String(valeur) ===
                    String(option.valeur)
                ) {

                    opt.selected =
                        true;
                }


                select.appendChild(
                    opt
                );
            }
        );


        select.addEventListener(
            "change",
            event => {

                const nouvelleValeur =
                    convertirValeur(
                        event.target.value,
                        "select"
                    );


                modifierProfil(
                    question.chemin,
                    nouvelleValeur
                );


                sauvegarderProfilLocalement();


                if (
                    question
                        .refreshOnChange
                ) {

                    afficherEtape();
                }
            }
        );


        wrapper.appendChild(
            select
        );
    }


    /* -----------------------------------------------------
       NUMBER / TEXT
    ----------------------------------------------------- */

    else {

        const ligne =
            document.createElement(
                "div"
            );

        ligne.className =
            "input-with-suffix";


        const input =
            document.createElement(
                "input"
            );


        input.type =
            question.type;


        input.value =
            afficherValeur(
                valeur
            );


        if (
            question.placeholder
        ) {

            input.placeholder =
                question.placeholder;
        }


        if (
            question.min !== undefined
        ) {

            input.min =
                question.min;
        }


        if (
            question.max !== undefined
        ) {

            input.max =
                question.max;
        }


        if (
            question.step !== undefined
        ) {

            input.step =
                question.step;
        }


        input.addEventListener(
            "change",
            event => {

                modifierProfil(

                    question.chemin,

                    convertirValeur(
                        event.target.value,
                        question.type
                    )
                );


                sauvegarderProfilLocalement();
            }
        );


        ligne.appendChild(
            input
        );


        if (question.suffixe) {

            const suffixe =
                document.createElement(
                    "span"
                );

            suffixe.className =
                "input-suffix";

            suffixe.textContent =
                question.suffixe;

            ligne.appendChild(
                suffixe
            );
        }


        wrapper.appendChild(
            ligne
        );
    }


    /* -----------------------------------------------------
       AIDE
    ----------------------------------------------------- */

    if (question.aide) {

        const aide =
            document.createElement(
                "p"
            );

        aide.className =
            "question-help";

        aide.textContent =
            question.aide;

        wrapper.appendChild(
            aide
        );
    }


    return wrapper;
}


/* =========================================================
   AFFICHAGE D'UNE ÉTAPE
========================================================= */

function afficherEtape() {

    const etape =
        ETAPES_QUESTIONNAIRE[
            etapeQuestionnaire
        ];


    document.getElementById(
        "question-title"
    ).textContent =
        etape.titre;


    document.getElementById(
        "question-subtitle"
    ).textContent =
        etape.sousTitre;


    const zoneQuestions =
        document.getElementById(
            "questions-container"
        );


    zoneQuestions.innerHTML =
        "";


    etape.questions.forEach(
        question => {

            if (
                question.afficherSi &&
                !question.afficherSi()
            ) {

                return;
            }


            zoneQuestions.appendChild(
                creerChampQuestion(
                    question
                )
            );
        }
    );


    /* PROGRESSION */

    const progression =
        (
            (
                etapeQuestionnaire + 1
            ) /
            ETAPES_QUESTIONNAIRE.length
        ) * 100;


    document.getElementById(
        "progress-bar"
    ).style.width =
        progression + "%";


    document.getElementById(
        "step-counter"
    ).textContent =
        `Étape ${
            etapeQuestionnaire + 1
        } sur ${
            ETAPES_QUESTIONNAIRE.length
        }`;


    /* BOUTONS */

    document.getElementById(
        "previous-button"
    ).style.display =
        etapeQuestionnaire === 0
            ? "none"
            : "inline-flex";


    const boutonSuivant =
        document.getElementById(
            "next-button"
        );


    if (
        etapeQuestionnaire ===
        ETAPES_QUESTIONNAIRE.length - 1
    ) {

        boutonSuivant.textContent =
            "Analyser mon exploitation";

        boutonSuivant.classList.add(
            "primary"
        );
    }

    else {

        boutonSuivant.textContent =
            "Continuer";

        boutonSuivant.classList.add(
            "primary"
        );
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   NAVIGATION
========================================================= */

function etapeSuivante() {

    sauvegarderProfilLocalement();


    if (
        etapeQuestionnaire <
        ETAPES_QUESTIONNAIRE.length - 1
    ) {

        etapeQuestionnaire++;

        afficherEtape();

        return;
    }


    afficherResultatsQuestionnaire();
}


function etapePrecedente() {

    if (
        etapeQuestionnaire > 0
    ) {

        etapeQuestionnaire--;

        afficherEtape();
    }
}


/* =========================================================
   RÉSULTATS
========================================================= */

function afficherResultatsQuestionnaire() {

    const zone =
        lireProfil(
            "general.territoire.zone"
        );


    const questionnaire =
        document.getElementById(
            "questionnaire-card"
        );


    const resultatsZone =
        document.getElementById(
            "results"
        );


    questionnaire.style.display =
        "none";


    resultatsZone.style.display =
        "block";


    resultatsZone.innerHTML = "";


    /* -----------------------------------------------------
       OUTRE-MER
    ----------------------------------------------------- */

    if (zone === "Outre-mer") {

        resultatsZone.innerHTML = `

            <div class="results-header">

                <span class="eyebrow">
                    ANALYSE PAC
                </span>

                <h2>
                    Profil enregistré
                </h2>

                <p>
                    Le moteur de calcul ultramarin
                    n'est pas encore intégré à cette
                    première version du simulateur.
                    Nous conserverons néanmoins les
                    informations renseignées.
                </p>

            </div>

            <button
                class="secondary-button"
                onclick="recommencerQuestionnaire()"
            >
                Modifier mon profil
            </button>
        `;

        return;
    }


    const orientations =
        analyserToutesLesAides();


    const calculs =
        calculerToutesLesAides();


    const aExaminer =
        orientations.filter(
            r =>
                r.statut ===
                STATUT_AIDE.A_EXAMINER
        );


    const incompletes =
        orientations.filter(
            r =>
                r.statut ===
                STATUT_AIDE
                    .INFORMATIONS_MANQUANTES
        );


    const nonRetenues =
        orientations.filter(
            r =>
                r.statut ===
                STATUT_AIDE.NON_RETENUE
        );


    /* -----------------------------------------------------
       EN-TÊTE
    ----------------------------------------------------- */

    const header =
        document.createElement(
            "div"
        );


    header.className =
        "results-header";


    header.innerHTML = `

        <span class="eyebrow">
            VOTRE ORIENTATION PAC 2026
        </span>

        <h2>
            ${aExaminer.length}
            aide${
                aExaminer.length > 1
                    ? "s"
                    : ""
            }
            à examiner
        </h2>

        <p>
            Cette orientation est établie à partir
            des informations renseignées.
            Elle ne constitue pas une décision
            administrative d'éligibilité.
        </p>
    `;


    resultatsZone.appendChild(
        header
    );


    /* -----------------------------------------------------
       AIDES À EXAMINER
    ----------------------------------------------------- */

    aExaminer.forEach(
        resultat => {

            const calcul =
                calculs.find(
                    c =>
                        c.id ===
                        resultat.id
                );


            const carte =
                document.createElement(
                    "article"
                );


            carte.className =
                "result-card success";


            let montantHTML = "";


            if (
                calcul &&
                calcul.montant !== null
            ) {

                montantHTML = `

                    <div class="result-amount">

                        ${
                            calcul
                                .montantFormate
                        }

                    </div>

                    <div class="result-reference">

                        ${
                            calcul
                                .anneeReference
                                ? `Référence ${
                                    calcul.anneeReference
                                }`
                                : "Calcul basé sur le profil"
                        }

                    </div>
                `;
            }


            carte.innerHTML = `

                <div class="result-status">
                    À EXAMINER
                </div>

                <h3>
                    ${resultat.nom}
                </h3>

                ${montantHTML}

                <div class="result-details">

                    ${
                        resultat.raisons
                            .map(
                                raison =>
                                    `<p>✓ ${raison}</p>`
                            )
                            .join("")
                    }

                </div>
            `;


            resultatsZone.appendChild(
                carte
            );
        }
    );


    /* -----------------------------------------------------
       INFORMATIONS MANQUANTES
    ----------------------------------------------------- */

    if (
        incompletes.length > 0
    ) {

        const titre =
            document.createElement(
                "h3"
            );

        titre.className =
            "results-section-title";

        titre.textContent =
            "Informations à compléter";

        resultatsZone.appendChild(
            titre
        );


        incompletes.forEach(
            resultat => {

                const carte =
                    document.createElement(
                        "article"
                    );


                carte.className =
                    "result-card warning";


                carte.innerHTML = `

                    <div class="result-status">
                        À COMPLÉTER
                    </div>

                    <h3>
                        ${resultat.nom}
                    </h3>

                    <p>
                        ${
                            resultat
                                .informationsManquantes
                                .join(" · ")
                        }
                    </p>
                `;


                resultatsZone.appendChild(
                    carte
                );
            }
        );
    }


    /* -----------------------------------------------------
       NON RETENUES
    ----------------------------------------------------- */

    if (
        nonRetenues.length > 0
    ) {

        const details =
            document.createElement(
                "details"
            );


        details.className =
            "not-retained";


        const summary =
            document.createElement(
                "summary"
            );


        summary.textContent =
            `${nonRetenues.length} aide(s) non retenue(s) avec les informations actuelles`;


        details.appendChild(
            summary
        );


        nonRetenues.forEach(
            resultat => {

                const ligne =
                    document.createElement(
                        "div"
                    );


                ligne.className =
                    "not-retained-item";


                ligne.innerHTML = `

                    <strong>
                        ${resultat.nom}
                    </strong>

                `;


                details.appendChild(
                    ligne
                );
            }
        );


        resultatsZone.appendChild(
            details
        );
    }


    /* -----------------------------------------------------
       ACTION
    ----------------------------------------------------- */

    const bouton =
        document.createElement(
            "button"
        );


    bouton.className =
        "secondary-button";

    bouton.textContent =
        "Modifier mes réponses";

    bouton.onclick =
        recommencerQuestionnaire;


    resultatsZone.appendChild(
        bouton
    );
}


/* =========================================================
   RETOUR AU QUESTIONNAIRE
========================================================= */

function recommencerQuestionnaire() {

    document.getElementById(
        "results"
    ).style.display =
        "none";


    document.getElementById(
        "questionnaire-card"
    ).style.display =
        "block";


    etapeQuestionnaire = 0;


    afficherEtape();
}


/* =========================================================
   INITIALISATION
========================================================= */

function initialiserQuestionnaire() {

    chargerProfilLocal();

    afficherEtape();


    document.getElementById(
        "next-button"
    ).addEventListener(
        "click",
        etapeSuivante
    );


    document.getElementById(
        "previous-button"
    ).addEventListener(
        "click",
        etapePrecedente
    );
}
