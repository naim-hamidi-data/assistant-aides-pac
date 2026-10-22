/* =========================================================
   QUESTIONNAIRE DYNAMIQUE — V2

   Principe : l'exploitant décrit son exploitation.
   L'application calcule ensuite les indicateurs PAC.
========================================================= */

let etapeQuestionnaire = 0;
let affichageResultats = false;

function positif(chemin) { return nombreOuZero(lireProfil(chemin)) > 0; }
function estGAEC() { return lireProfil("general.statutJuridique") === "GAEC"; }
function aDPB() { return lireProfil("dpb.detientDPB") === true; }
function estIndividuel() { return lireProfil("general.statutJuridique") === "individuel"; }
function estSociete() { return ["GAEC", "EARL", "SCEA", "SAS", "SARL", "SA"].includes(lireProfil("general.statutJuridique")); }
function societeSansATEXA() { return estSociete() && lireProfil("statutActif.sansAssocieATEXA") === true; }
function societeAvecATEXA() { return estSociete() && lireProfil("statutActif.sansAssocieATEXA") === false; }
function autrePersonneMorale() { return ["association", "fondation", "public", "cooperative", "autre"].includes(lireProfil("general.statutJuridique")); }
function ageIndividuelPlus67() { return estIndividuel() && nombreOuZero(lireProfil("statutActif.ageExploitant")) > 67; }
function premiereInstallation() { return lireProfil("installation.premiereInstallation") === true; }
function aBovins() { return lireProfil("bovins.present") === true; }
function aVeaux() { return lireProfil("veauxQualite.present") === true; }
function aOvins() { return lireProfil("ovins.present") === true; }
function aCaprins() { return lireProfil("caprins.present") === true; }
function estCorseProfil() { return lireProfil("general.territoire") === "Corse"; }
function enZoneICHN() { return lireProfil("ichn.zoneEligible") === true; }
function estICHNHorsMontagne() { return ["piemont", "zone_defavorisee_simple"].includes(lireProfil("ichn.typeZone")); }
function enConversionBio() { return lireProfil("conversionBio.enConversion") === true; }
function souhaiteMAEC() { return lireProfil("maec.souhaiteExaminer") === true; }
function aContratMRC() { return lireProfil("assurance.souscritMRC") === true; }
function aSecteurOPDetecte() { return calculerSecteursPresents().some(s => ["fruits_legumes", "huile_olive", "proteines", "horticulture", "veau_label", "lapin", "riz"].includes(s)); }

function q(chemin, label, type = "number", options = {}) {
    return { chemin, label, type, ...options };
}

function h(titre, texte = "") {
    return { type: "heading", titre, texte };
}

const OUI_NON = [
    { valeur: "", texte: "Je ne sais pas" },
    { valeur: "true", texte: "Oui" },
    { valeur: "false", texte: "Non" }
];

const ETAPES_QUESTIONNAIRE = [
    {
        titre: "Mon exploitation",
        sousTitre: "Identité du dossier et informations permettant au moteur d'évaluer automatiquement le statut d'agriculteur actif.",
        questions: [
            h("Dossier", "Le site reste générique ; l'année sert uniquement aux règles qui dépendent de la campagne, notamment l'ACJA."),
            q("general.anneeDemande", "Année de campagne visée", "number", { min: 2023, max: 2027, step: 1, aide: "Référentiel actuellement limité à la programmation PAC 2023-2027." }),
            q("general.territoire", "Territoire principal", "select", { options: [
                { valeur: "Hexagone", texte: "France métropolitaine hors Corse" },
                { valeur: "Corse", texte: "Corse" },
                { valeur: "Outre-mer", texte: "Outre-mer – orientation partielle" }
            ], refreshOnChange: true }),
            q("general.region", "Région", "text", { placeholder: "Ex. Occitanie" }),
            q("general.departement", "Département", "text", { placeholder: "Ex. Haute-Garonne" }),
            q("general.commune", "Commune", "text", { placeholder: "Facultatif" }),

            h("Forme juridique"),
            q("general.statutJuridique", "Statut juridique", "select", { options: [
                { valeur: "", texte: "Sélectionner" },
                { valeur: "individuel", texte: "Exploitant individuel" },
                { valeur: "GAEC", texte: "GAEC" },
                { valeur: "EARL", texte: "EARL" },
                { valeur: "SCEA", texte: "SCEA" },
                { valeur: "SAS", texte: "SAS" },
                { valeur: "SARL", texte: "SARL" },
                { valeur: "SA", texte: "SA" },
                { valeur: "cooperative", texte: "Coopérative / SCOP agricole" },
                { valeur: "association", texte: "Association" },
                { valeur: "fondation", texte: "Fondation" },
                { valeur: "public", texte: "Structure de droit public" },
                { valeur: "indivision", texte: "Indivision" },
                { valeur: "autre", texte: "Autre personne morale" }
            ], refreshOnChange: true }),
            q("general.gaecTotal", "S'agit-il d'un GAEC total ?", "yesno", { afficherSi: estGAEC }),
            q("general.nombreAssocies", "Nombre d'associés", "number", { min: 1, afficherSi: estGAEC }),

            h("Données utilisées pour déterminer le caractère d'agriculteur actif"),
            q("statutActif.ageExploitant", "Âge de l'exploitant", "number", { min: 18, max: 110, afficherSi: estIndividuel, refreshOnChange: true }),
            q("statutActif.affilieATEXA", "Êtes-vous affilié à l'ATEXA au titre de l'exploitation ?", "yesno", { afficherSi: estIndividuel }),
            q("statutActif.retraiteLiquideeApres67", "Avez-vous liquidé vos droits à la retraite ?", "yesno", { afficherSi: ageIndividuelPlus67, aide: "Question utilisée uniquement pour la condition d'agriculteur actif après 67 ans." }),

            q("statutActif.sansAssocieATEXA", "La société fonctionne-t-elle sans associé cotisant à l'ATEXA ?", "yesno", { afficherSi: estSociete, refreshOnChange: true }),
            q("statutActif.associeAffilieATEXA", "Au moins un associé est-il affilié à l'ATEXA au titre de la société ?", "yesno", { afficherSi: societeAvecATEXA }),
            q("statutActif.associeRespecteCritereAgeRetraite", "Cet associé respecte-t-il le critère d'âge / retraite du guide ?", "yesno", { afficherSi: societeAvecATEXA, aide: "67 ans ou moins, ou situation de retraite compatible au-delà de 67 ans." }),

            q("statutActif.activiteAgricoleSociete", "La société exerce-t-elle une activité agricole ?", "yesno", { afficherSi: societeSansATEXA }),
            q("statutActif.dirigeantsAffiliesATMPAgricole", "Tous les dirigeants associés relèvent-ils de l'AT/MP des salariés agricoles ?", "yesno", { afficherSi: societeSansATEXA }),
            q("statutActif.dirigeantsRespectentRetraite", "Les dirigeants de plus de 67 ans respectent-ils la condition de retraite ?", "yesno", { afficherSi: societeSansATEXA }),
            q("statutActif.dirigeantsDetiennent5Pourcent", "Les dirigeants détiennent-ils ensemble au moins 5 % des parts sociales ?", "yesno", { afficherSi: societeSansATEXA }),

            q("statutActif.autrePersonneMoraleActiviteAgricoleStatutaire", "La structure exerce-t-elle l'activité agricole prévue par ses statuts / sur ses propres exploitations ?", "yesno", { afficherSi: autrePersonneMorale })
        ],
        panneau: "actif"
    },

    {
        titre: "Mes surfaces et mes DPB",
        sousTitre: "Ces données servent de base aux paiements découplés, à l'écorégime et à plusieurs dispositifs.",
        questions: [
            h("Surfaces de l'exploitation"),
            q("surfaces.sau", "SAU totale", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("surfaces.surfaceAdmissible", "Surface admissible PAC", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("surfaces.terresArables", "Terres arables", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("surfaces.prairiesPermanentes", "Prairies permanentes", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("surfaces.culturesPermanentes", "Cultures permanentes (vignes, vergers, etc.)", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("surfaces.surfaceFourragere", "Surface fourragère totale", "number", { suffixe: "ha", min: 0, step: 0.01, aide: "Utilisée notamment pour le calcul indicatif des plafonds bovins." }),

            h("Droits à paiement de base"),
            q("dpb.detientDPB", "L'exploitation détient-elle des DPB ?", "yesno", { refreshOnChange: true }),
            q("dpb.nombreDPB", "Nombre de DPB détenus", "number", { min: 0, step: 0.01, afficherSi: aDPB }),
            q("dpb.nombreDPBActives", "Nombre de DPB activés / activables", "number", { min: 0, step: 0.01, afficherSi: aDPB }),
            q("dpb.valeurMoyenneDPB", "Valeur moyenne réelle de vos DPB", "number", { suffixe: "€/DPB", min: 0, step: 0.01, afficherSi: aDPB, aide: "Laissez vide si inconnue." }),
            q("dpb.valeurTotaleDPB", "Valeur totale des DPB activés, si connue", "number", { suffixe: "€", min: 0, step: 0.01, afficherSi: aDPB, aide: "Si renseignée, cette valeur est prioritaire pour l'estimation de l'aide de base." })
        ]
    },

    {
        titre: "Mon assolement",
        sousTitre: "Renseignez des surfaces, pas des points. Le score de diversification de l'écorégime est calculé automatiquement.",
        questions: [
            h("Répartition des terres arables pour l'écorégime", "La somme des catégories doit être proche de votre surface totale en terres arables. Saisissez 0 si une catégorie est absente."),
            q("assolement.prairieTemporaire", "Prairies temporaires", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("assolement.jachereTotale", "Jachères totales", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("assolement.jachereEcoEligible", "Dont jachères respectant les conditions écorégime et cochées IAE", "number", { suffixe: "ha", min: 0, step: 0.01, aide: "Cette surface peut apporter des points de diversification et intervient dans la voie biodiversité." }),
            q("assolement.legumineuses", "Légumineuses à graines et fourragères", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("assolement.cerealesHiver", "Céréales d'hiver", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("assolement.cerealesPrintemps", "Céréales de printemps", "number", { suffixe: "ha", min: 0, step: 0.01, aide: "Incluez notamment le maïs dans cette catégorie selon le classement utilisé par le barème." }),
            q("assolement.plantesSarclees", "Plantes sarclées", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("assolement.oleagineuxHiver", "Oléagineux d'hiver", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("assolement.oleagineuxPrintemps", "Oléagineux de printemps", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("assolement.autresCultures", "Autres cultures / cultures à potentiel de diversification", "number", { suffixe: "ha", min: 0, step: 0.01 }),

            h("Productions particulières", "Ces surfaces servent aux aides couplées. Elles peuvent être incluses dans les catégories ci-dessus : ne les additionnez pas une seconde fois à votre total de terres arables."),
            q("productionsVegetales.legumineusesGraines.surface", "Légumineuses à graines / déshydratation / semences", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("productionsVegetales.legumineusesFourrageres.surface", "Légumineuses fourragères", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("productionsVegetales.bleDur.surface", "Blé dur", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("productionsVegetales.pommeTerreFeculiere.surface", "Pommes de terre féculières", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("productionsVegetales.riz.surface", "Riz", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("productionsVegetales.houblon.surface", "Houblon", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("productionsVegetales.semencesGraminees.surface", "Semences de graminées prairiales", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("productionsVegetales.chanvre.surface", "Chanvre", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("productionsVegetales.maraichage.surfaceLegumesFrais", "Légumes frais (hors pommes de terre primeur)", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("productionsVegetales.maraichage.surfacePetitsFruitsRouges", "Petits fruits rouges", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("productionsVegetales.fruitsTransformes.pruneEnte", "Prunes d'Ente destinées à la transformation", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("productionsVegetales.fruitsTransformes.ceriseBigarreau", "Cerises Bigarreau destinées à la transformation", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("productionsVegetales.fruitsTransformes.poireWilliams", "Poires Williams destinées à la transformation", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("productionsVegetales.fruitsTransformes.pechePavie", "Pêches Pavie destinées à la transformation", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("productionsVegetales.fruitsTransformes.tomateIndustrie", "Tomates industrie", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("productionsVegetales.autres.viticulture", "Vignes", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("productionsVegetales.autres.oliveraie", "Oliveraies", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("productionsVegetales.autres.horticulture", "Horticulture", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("productionsVegetales.autres.ppam", "PPAM", "number", { suffixe: "ha", min: 0, step: 0.01 })
        ],
        panneau: "assolement"
    },

    {
        titre: "Mon élevage",
        sousTitre: "Renseignez des effectifs animaux. Les UGB bovines sont calculées automatiquement.",
        questions: [
            h("Bovins"),
            q("bovins.present", "Avez-vous un atelier bovin ?", "yesno", { refreshOnChange: true }),
            q("bovins.vachesEligibles", "Nombre de vaches éligibles servant au plafond des mâles", "number", { min: 0, afficherSi: aBovins }),
            q("bovins.malesPlus2Ans", "Mâles de plus de 2 ans potentiellement éligibles", "number", { min: 0, afficherSi: aBovins }),
            q("bovins.males16a24Mois", "Mâles de 16 à 24 mois potentiellement éligibles", "number", { min: 0, afficherSi: aBovins }),
            q("bovins.femellesRaceViandePlus2Ans", "Femelles de race viande de plus de 2 ans", "number", { min: 0, afficherSi: aBovins }),
            q("bovins.femellesRaceViande16a24Mois", "Femelles de race viande de 16 à 24 mois", "number", { min: 0, afficherSi: aBovins }),
            q("bovins.autresFemellesPlus2Ans", "Autres femelles de plus de 2 ans", "number", { min: 0, afficherSi: aBovins }),
            q("bovins.autresFemelles16a24Mois", "Autres femelles de 16 à 24 mois", "number", { min: 0, afficherSi: aBovins }),
            q("bovins.veauxRaceViandeNesGardes90Jours", "Veaux de race viande nés sur l'exploitation et détenus au moins 90 jours", "number", { min: 0, afficherSi: aBovins }),
            q("bovins.animauxDetenus6Mois", "Les bovins concernés respectent-ils la durée de détention requise ?", "yesno", { afficherSi: aBovins }),
            q("bovins.identificationConforme", "Identification et enregistrement conformes ?", "yesno", { afficherSi: aBovins }),

            h("Veaux sous signe de qualité / bio"),
            q("veauxQualite.present", "Produisez-vous des veaux sous signe de qualité ou bio ?", "yesno", { refreshOnChange: true }),
            q("veauxQualite.nombreVeauxEligibles", "Nombre de veaux potentiellement concernés", "number", { min: 0, afficherSi: aVeaux }),
            q("veauxQualite.labelRouge", "Label rouge", "yesno", { afficherSi: aVeaux }),
            q("veauxQualite.igpRoseePyreneesCatalanes", "IGP Rosée des Pyrénées Catalanes", "yesno", { afficherSi: aVeaux }),
            q("veauxQualite.agricultureBiologique", "Agriculture biologique", "yesno", { afficherSi: aVeaux }),
            q("veauxQualite.detention45Jours", "Détention minimale requise respectée ?", "yesno", { afficherSi: aVeaux }),
            q("veauxQualite.identificationConforme", "Identification conforme ?", "yesno", { afficherSi: aVeaux }),

            h("Ovins"),
            q("ovins.present", "Avez-vous un atelier ovin ?", "yesno", { refreshOnChange: true }),
            q("ovins.nombreBrebis", "Nombre de brebis", "number", { min: 0, afficherSi: aOvins }),
            q("ovins.nouveauProducteur", "Atelier ovin créé depuis moins de 3 ans ?", "yesno", { afficherSi: aOvins }),
            q("ovins.nombreBrebisPresentes1JanvierNMoins1", "Brebis présentes au 1er janvier de l'année précédente", "number", { min: 0, afficherSi: () => aOvins() && lireProfil("ovins.nouveauProducteur") !== true }),
            q("ovins.nombreAgneauxVendusNMoins1", "Agneaux vendus l'année précédente", "number", { min: 0, afficherSi: () => aOvins() && lireProfil("ovins.nouveauProducteur") !== true }),
            q("ovins.detention100Jours", "Détention pendant 100 jours respectée ?", "yesno", { afficherSi: aOvins }),
            q("ovins.identificationConforme", "Identification conforme ?", "yesno", { afficherSi: aOvins }),

            h("Caprins"),
            q("caprins.present", "Avez-vous un atelier caprin ?", "yesno", { refreshOnChange: true }),
            q("caprins.nombreChevres", "Nombre de chèvres", "number", { min: 0, afficherSi: aCaprins }),
            q("caprins.detention100Jours", "Détention pendant 100 jours respectée ?", "yesno", { afficherSi: aCaprins }),
            q("caprins.identificationConforme", "Identification conforme ?", "yesno", { afficherSi: aCaprins }),
            q("corse.sousAOPBrocciu", "Atelier engagé sous AOP Brocciu ?", "yesno", { afficherSi: () => estCorseProfil() && (aOvins() || aCaprins()) }),

            h("Autres ateliers utiles à l'orientation"),
            q("autresAnimaux.ugbDeclareesHorsBovins", "UGB d'autres herbivores / monogastriques si vous les connaissez", "number", { min: 0, step: 0.1, aide: "Le guide utilisé ne fournit pas les coefficients UGB de toutes les espèces ; cette valeur permet de compléter les calculs ICHN / légumineuses." }),
            q("autresAnimaux.nombreRuches", "Nombre de ruches", "number", { min: 0 }),
            q("autresAnimaux.nombreLapins", "Nombre de lapins / atelier cunicole", "number", { min: 0 })
        ],
        panneau: "elevage"
    },

    {
        titre: "Mes pratiques et certifications",
        sousTitre: "Le moteur compare automatiquement les trois voies de l'écorégime et détermine le meilleur niveau détecté.",
        questions: [
            h("Voie des pratiques"),
            q("pratiques.surfacePPRespectantCritereEcoregime", "Surface de prairies permanentes non labourées et respectant le critère applicable", "number", { suffixe: "ha", min: 0, step: 0.01, afficherSi: () => nombreOuZero(lireProfil("surfaces.prairiesPermanentes")) > 0 }),
            q("pratiques.surfaceCPCouverteEcoregime", "Surface de cultures permanentes dont les inter-rangs / la surface sont couverts", "number", { suffixe: "ha", min: 0, step: 0.01, afficherSi: () => nombreOuZero(lireProfil("surfaces.culturesPermanentes")) > 0 }),

            h("Voie certification"),
            q("pratiques.agricultureBiologiqueTouteExploitation", "Toute l'exploitation est-elle certifiée AB ?", "yesno"),
            q("pratiques.hveRenovee", "Certification HVE rénovée ?", "yesno"),
            q("pratiques.certificationCE2Plus", "Certification CE2+ reconnue ?", "yesno"),

            h("Biodiversité et haies"),
            q("pratiques.iaeAutresEquivalentHa", "Surface équivalente des autres IAE, hors haies et jachères déjà renseignées", "number", { suffixe: "ha équiv.", min: 0, step: 0.01 }),
            q("pratiques.longueurHaiesTotaleM", "Longueur totale de haies", "number", { suffixe: "m", min: 0, step: 1 }),
            q("pratiques.longueurHaiesTerresArablesM", "Longueur de haies située sur les terres arables", "number", { suffixe: "m", min: 0, step: 1, afficherSi: () => nombreOuZero(lireProfil("surfaces.terresArables")) > 0 }),
            q("pratiques.certificationHaiesDurables", "Disposez-vous d'une certification reconnue de gestion durable des haies ?", "yesno"),
            q("pratiques.maecEntretienLigneux", "Êtes-vous engagé en MAEC Biodiversité – entretien des ligneux ?", "yesno"),

            h("Installation"),
            q("installation.premiereInstallation", "S'agit-il d'une première installation récente ?", "yesno", { refreshOnChange: true }),
            q("installation.ageJA", "Âge du jeune agriculteur / associé concerné", "number", { min: 18, max: 100, afficherSi: premiereInstallation }),
            q("installation.anneeInstallation", "Année de première installation", "number", { min: 1900, max: 2035, afficherSi: premiereInstallation }),
            q("installation.diplomeAgricoleNiveau4OuPlus", "Diplôme agricole de niveau 4 ou supérieur ?", "yesno", { afficherSi: premiereInstallation }),
            q("installation.diplomeNiveau3OuPlus", "Diplôme de niveau 3 ou supérieur, quelle que soit la spécialité ?", "yesno", { afficherSi: premiereInstallation }),
            q("installation.experienceAgricoleMois", "Expérience professionnelle en production agricole", "number", { suffixe: "mois", min: 0, afficherSi: premiereInstallation }),
            q("installation.nombreAssociesJAEligibles", "Nombre d'associés JA potentiellement éligibles", "number", { min: 0, afficherSi: () => premiereInstallation() && estGAEC() })
        ],
        panneau: "ecoregime"
    },

    {
        titre: "Zones, engagements et contrats",
        sousTitre: "Ces questions apparaissent uniquement lorsque vos productions ou votre localisation peuvent ouvrir un dispositif complémentaire.",
        questions: [
            h("Conditions liées à certaines productions"),
            q("productionsVegetales.legumineusesGraines.destination", "Destination des légumineuses à graines / assimilées", "select", { afficherSi: () => positif("productionsVegetales.legumineusesGraines.surface"), options: [
                { valeur: "", texte: "Sélectionner" },
                { valeur: "graines", texte: "Graines / protéagineux / soja" },
                { valeur: "deshydratation", texte: "Déshydratation" },
                { valeur: "semences", texte: "Production de semences" }
            ], refreshOnChange: true }),
            q("productionsVegetales.legumineusesGraines.contratDeshydratation", "Contrat avec une entreprise de déshydratation ?", "yesno", { afficherSi: () => lireProfil("productionsVegetales.legumineusesGraines.destination") === "deshydratation" }),
            q("productionsVegetales.legumineusesGraines.melangeProteagineuxPourcent", "Part de protéagineux dans le mélange, si applicable", "number", { suffixe: "%", min: 0, max: 100, afficherSi: () => positif("productionsVegetales.legumineusesGraines.surface") }),

            q("productionsVegetales.legumineusesFourrageres.zone", "Zone des légumineuses fourragères", "select", { afficherSi: () => positif("productionsVegetales.legumineusesFourrageres.surface"), options: [
                { valeur: "", texte: "Sélectionner" }, { valeur: "plaine_piemont", texte: "Plaine / piémont" }, { valeur: "montagne", texte: "Montagne" }
            ] }),
            q("productionsVegetales.legumineusesFourrageres.contratEleveur5UGB", "Contrat direct avec un éleveur détenant au moins 5 UGB ?", "yesno", { afficherSi: () => positif("productionsVegetales.legumineusesFourrageres.surface") }),
            q("productionsVegetales.legumineusesFourrageres.melangeLegumineusesPourcent", "Part de légumineuses à l'implantation si mélange", "number", { suffixe: "%", min: 0, max: 100, afficherSi: () => positif("productionsVegetales.legumineusesFourrageres.surface") }),
            q("productionsVegetales.legumineusesFourrageres.melangeAvecGraminees", "Mélange avec des graminées ?", "yesno", { afficherSi: () => positif("productionsVegetales.legumineusesFourrageres.surface"), refreshOnChange: true }),
            q("productionsVegetales.legumineusesFourrageres.anneeSemis", "S'agit-il de l'année du semis ?", "yesno", { afficherSi: () => positif("productionsVegetales.legumineusesFourrageres.surface") && lireProfil("productionsVegetales.legumineusesFourrageres.melangeAvecGraminees") === true }),
            q("productionsVegetales.bleDur.contratCollecteur", "Contrat annuel de livraison du blé dur avec un collecteur ?", "yesno", { afficherSi: () => positif("productionsVegetales.bleDur.surface") }),
            q("productionsVegetales.pommeTerreFeculiere.contratTransformation", "Contrat pour la pomme de terre féculière ?", "yesno", { afficherSi: () => positif("productionsVegetales.pommeTerreFeculiere.surface") }),
            q("productionsVegetales.semencesGraminees.contratCulture", "Contrat de culture pour les semences de graminées ?", "yesno", { afficherSi: () => positif("productionsVegetales.semencesGraminees.surface") }),
            q("productionsVegetales.semencesGraminees.varieteAutorisee", "Variété autorisée / inscrite ?", "yesno", { afficherSi: () => positif("productionsVegetales.semencesGraminees.surface") }),
            q("productionsVegetales.semencesGraminees.usageGazonUniquement", "Production destinée uniquement au gazon ?", "yesno", { afficherSi: () => positif("productionsVegetales.semencesGraminees.surface") }),
            q("productionsVegetales.chanvre.contratTransformationOuSemences", "Contrat de transformation ou production de semences certifiées pour le chanvre ?", "yesno", { afficherSi: () => positif("productionsVegetales.chanvre.surface") }),
            q("productionsVegetales.chanvre.thcConforme", "Chanvre conforme au seuil réglementaire de THC ?", "yesno", { afficherSi: () => positif("productionsVegetales.chanvre.surface") }),
            q("productionsVegetales.fruitsTransformes.deboucheIndustriel", "Adhésion à une OP reconnue ou contrat avec une usine de transformation ?", "yesno", { afficherSi: () => sommeSurfacesFruitsTransformes() > 0 }),

            h("ICHN"),
            q("ichn.zoneEligible", "Avez-vous des surfaces situées dans une zone éligible à l'ICHN ?", "yesno", { refreshOnChange: true }),
            q("ichn.typeZone", "Type de zone ICHN", "select", { afficherSi: enZoneICHN, refreshOnChange: true, options: [
                { valeur: "", texte: "Je ne sais pas" }, { valeur: "haute_montagne", texte: "Haute montagne" }, { valeur: "montagne", texte: "Montagne" }, { valeur: "piemont", texte: "Piémont" }, { valeur: "zone_defavorisee_simple", texte: "Zone défavorisée simple / autre zone hors montagne" }
            ] }),
            q("ichn.pourcentageSAUZoneDefavorisee", "Part de la SAU située en zone défavorisée", "number", { suffixe: "%", min: 0, max: 100, step: 0.1, afficherSi: enZoneICHN }),
            q("ichn.siegeEnZoneDefavorisee", "Siège d'exploitation situé en zone défavorisée ?", "yesno", { afficherSi: () => enZoneICHN() && estICHNHorsMontagne() }),
            q("ichn.partRevenuAgricolePourcent", "Part approximative du revenu provenant de l'activité agricole", "number", { suffixe: "%", min: 0, max: 100, afficherSi: enZoneICHN }),
            q("ichn.surfacesFourrageresEligibles", "Surface fourragère située en zone défavorisée", "number", { suffixe: "ha", min: 0, step: 0.01, afficherSi: enZoneICHN }),
            q("ichn.surfacesVegetalesEligibles", "Cultures de vente admissibles en zone de montagne", "number", { suffixe: "ha", min: 0, step: 0.01, afficherSi: enZoneICHN }),
            q("ichn.zoneSeche", "Les surfaces ICHN végétales sont-elles en zone sèche ?", "yesno", { afficherSi: () => enZoneICHN() && positif("ichn.surfacesVegetalesEligibles") }),
            q("ichn.montantVariableSousZone", "Montant variable local ICHN animale, si vous le connaissez", "number", { suffixe: "€/ha", min: 0, step: 0.01, afficherSi: () => enZoneICHN() && positif("ichn.surfacesFourrageresEligibles"), aide: "Facultatif. Sans cette donnée, le simulateur affiche seulement la part fixe théorique et signale que le calcul final est local." }),
            q("ichn.coefficientModulationChargement", "Coefficient local de modulation par le chargement, si connu", "number", { min: 0, max: 1, step: 0.01, afficherSi: () => enZoneICHN() && positif("ichn.surfacesFourrageresEligibles"), aide: "Ex. 1 pour 100 %. Facultatif." }),

            h("Conversion biologique"),
            q("conversionBio.enConversion", "Avez-vous des surfaces en conversion vers l'agriculture biologique ?", "yesno", { refreshOnChange: true }),
            q("conversionBio.premiereOuDeuxiemeAnnee", "Ces surfaces sont-elles en première ou deuxième année de conversion ?", "yesno", { afficherSi: enConversionBio }),
            q("conversionBio.landesEstivesParcours", "Landes, estives et parcours associés à un atelier d'élevage", "number", { suffixe: "ha", min: 0, afficherSi: enConversionBio }),
            q("conversionBio.prairiesAvecElevage", "Prairies associées à un atelier d'élevage", "number", { suffixe: "ha", min: 0, afficherSi: enConversionBio }),
            q("conversionBio.culturesAnnuellesLegumineusesJacheresSemences", "Cultures annuelles / légumineuses / jachères / semences concernées", "number", { suffixe: "ha", min: 0, afficherSi: enConversionBio }),
            q("conversionBio.viticulture", "Viticulture en conversion", "number", { suffixe: "ha", min: 0, afficherSi: enConversionBio }),
            q("conversionBio.ppamListees", "PPAM de la liste à 350 €/ha", "number", { suffixe: "ha", min: 0, afficherSi: enConversionBio }),
            q("conversionBio.legumesPleinChampBetterave", "Légumes de plein champ / betterave sucrière", "number", { suffixe: "ha", min: 0, afficherSi: enConversionBio }),
            q("conversionBio.maraichageArboricultureAutresPpamSemences", "Maraîchage / arboriculture / autres PPAM / semences concernées", "number", { suffixe: "ha", min: 0, afficherSi: enConversionBio }),

            h("MAEC, risques et autres dispositifs"),
            q("maec.souhaiteExaminer", "Souhaitez-vous vérifier les MAEC disponibles localement ?", "yesno", { refreshOnChange: true }),
            q("maec.offreLocaleConnue", "Savez-vous si une MAEC est ouverte sur votre territoire ?", "yesno", { afficherSi: souhaiteMAEC }),
            q("maec.type", "Type de MAEC envisagée", "select", { afficherSi: souhaiteMAEC, options: [
                { valeur: "", texte: "Je ne sais pas" }, { valeur: "systeme", texte: "Mesure système" }, { valeur: "localisee", texte: "Mesure localisée / parcellaire" }
            ] }),
            q("assurance.souscritMRC", "Avez-vous souscrit une assurance multirisques climatique des récoltes ?", "yesno", { refreshOnChange: true }),
            q("assurance.primeAnnuelle", "Prime / cotisation annuelle", "number", { suffixe: "€", min: 0, step: 0.01, afficherSi: aContratMRC }),
            q("predation.zoneRisque", "Votre commune / troupeau est-il concerné par un cercle de prédation loup ou ours ?", "yesno", { afficherSi: () => aOvins() || aCaprins() }),
            q("programmesSectoriels.membreOPAOP", "Êtes-vous membre d'une OP/AOP pour les filières concernées ?", "yesno", { afficherSi: aSecteurOPDetecte }),
            q("regional.projetPrincipal", "Avez-vous un projet pouvant relever d'une aide régionale du Feader ?", "select", { options: [
                { valeur: "", texte: "Non / aucun projet identifié" },
                { valeur: "investissement", texte: "Investissement" },
                { valeur: "installation", texte: "Installation / nouvel installé" },
                { valeur: "maec_forfaitaire", texte: "MAEC forfaitaire / API / PRM" },
                { valeur: "gardiennage", texte: "Gardiennage hors prédation" },
                { valeur: "betteraves", texte: "Gestion des risques betteraves" },
                { valeur: "leader", texte: "LEADER / coopération" },
                { valeur: "formation", texte: "Formation / échange de connaissances" },
                { valeur: "autre", texte: "Autre projet régional" }
            ] })
        ],
        panneau: "synthese"
    }
];

/* =========================================================
   CONVERSION ET RENDU DES CHAMPS
========================================================= */

function convertirValeur(valeur, type) {
    if (valeur === "") return null;
    if (type === "number") {
        const n = Number(valeur);
        return Number.isFinite(n) ? n : null;
    }
    if (valeur === "true") return true;
    if (valeur === "false") return false;
    return valeur;
}

function afficherValeur(v) {
    return v === null || v === undefined ? "" : v;
}

function creerChampQuestion(question) {
    if (question.type === "heading") {
        const bloc = document.createElement("div");
        bloc.className = "form-section-heading";
        bloc.innerHTML = `<h3>${question.titre}</h3>${question.texte ? `<p>${question.texte}</p>` : ""}`;
        return bloc;
    }

    const valeur = lireProfil(question.chemin);
    const wrapper = document.createElement("div");
    wrapper.className = "question-item";

    const zoneLibelle = document.createElement("div");
    zoneLibelle.className = "question-copy";
    const label = document.createElement("label");
    label.className = "question-label";
    label.textContent = question.label;
    zoneLibelle.appendChild(label);
    if (question.aide) {
        const aide = document.createElement("p");
        aide.className = "question-help";
        aide.textContent = question.aide;
        zoneLibelle.appendChild(aide);
    }
    wrapper.appendChild(zoneLibelle);

    const controle = document.createElement("div");
    controle.className = "question-control";

    if (question.type === "yesno") {
        const groupe = document.createElement("div");
        groupe.className = "yesno-group";
        [{ texte: "Oui", valeur: true }, { texte: "Non", valeur: false }].forEach(option => {
            const bouton = document.createElement("button");
            bouton.type = "button";
            bouton.className = "answer-button";
            if (valeur === option.valeur) bouton.classList.add("selected");
            bouton.textContent = option.texte;
            bouton.addEventListener("click", () => {
                modifierProfil(question.chemin, option.valeur);
                sauvegarderProfilLocalement();
                afficherEtape();
            });
            groupe.appendChild(bouton);
        });
        controle.appendChild(groupe);
    } else if (question.type === "select") {
        const select = document.createElement("select");
        (question.options || []).forEach(option => {
            const opt = document.createElement("option");
            opt.value = option.valeur;
            opt.textContent = option.texte;
            if (String(valeur ?? "") === String(option.valeur)) opt.selected = true;
            select.appendChild(opt);
        });
        select.addEventListener("change", event => {
            modifierProfil(question.chemin, convertirValeur(event.target.value, "select"));
            sauvegarderProfilLocalement();
            if (question.refreshOnChange) afficherEtape();
            else mettreAJourPanneau();
        });
        controle.appendChild(select);
    } else {
        const ligne = document.createElement("div");
        ligne.className = "input-with-suffix";
        const input = document.createElement("input");
        input.type = question.type;
        input.value = afficherValeur(valeur);
        if (question.placeholder) input.placeholder = question.placeholder;
        if (question.min !== undefined) input.min = question.min;
        if (question.max !== undefined) input.max = question.max;
        if (question.step !== undefined) input.step = question.step;
        input.addEventListener("change", event => {
            modifierProfil(question.chemin, convertirValeur(event.target.value, question.type));
            sauvegarderProfilLocalement();
            if (question.refreshOnChange) afficherEtape();
            else mettreAJourPanneau();
        });
        ligne.appendChild(input);
        if (question.suffixe) {
            const suffixe = document.createElement("span");
            suffixe.className = "input-suffix";
            suffixe.textContent = question.suffixe;
            ligne.appendChild(suffixe);
        }
        controle.appendChild(ligne);
    }

    wrapper.appendChild(controle);
    return wrapper;
}

/* =========================================================
   PANNEAUX DE CALCUL AUTOMATIQUE
========================================================= */

function texteNiveau(n) {
    return n === "bio" ? "niveau spécifique AB" : n === "superieur" ? "niveau supérieur" : n === "base" ? "niveau de base" : "non atteint";
}

function htmlPanneauActif() {
    const a = calculerAgriculteurActif();
    if (a.statut === true) return `<div class="live-result ok"><strong>Agriculteur actif : critère initialement compatible</strong><span>${a.raisons.join(" ")}</span></div>`;
    if (a.statut === false) return `<div class="live-result no"><strong>Agriculteur actif : critère non rempli avec les réponses actuelles</strong><span>${a.raisons.join(" ")}</span></div>`;
    return `<div class="live-result pending"><strong>Agriculteur actif : à déterminer</strong><span>À compléter : ${a.manquants.join(" · ")}</span></div>`;
}

function htmlPanneauAssolement() {
    const s = calculerScoreDiversification();
    const classe = s.complet ? (s.points >= 5 ? "ok" : s.points >= 4 ? "warn" : "no") : "pending";
    const details = s.details.map(d => `${d.libelle} +${d.points}`).join(" · ") || "Aucun point calculé pour l'instant";
    return `<div class="live-result ${classe}"><strong>Score de diversification calculé : ${s.points} point(s)</strong><span>${s.complet ? details : `Répartition à compléter. Somme saisie : ${Math.round(s.sommeAssolement * 100) / 100} ha pour ${Math.round(s.terresArables * 100) / 100} ha de TA.`}</span></div>`;
}

function htmlPanneauElevage() {
    const u = calculerUGBBovines();
    const autres = nombreOuZero(profilExploitation.autresAnimaux.ugbDeclareesHorsBovins);
    return `<div class="live-result info"><strong>UGB bovines calculées : ${Math.round(u.total * 10) / 10}</strong><span>Niveau supérieur brut : ${Math.round(u.niveauSuperieurBrut * 10) / 10} UGB · niveau base brut : ${Math.round(u.niveauBaseBrut * 10) / 10} UGB${autres > 0 ? ` · autres UGB déclarées : ${autres}` : ""}</span></div>`;
}

function htmlPanneauEcoregime() {
    const d = calculerDiagnosticEcoregime();
    const score = d.scoreDiversification;
    const lignes = [];
    if (d.voies.pratiques.eligible) lignes.push(`Pratiques : ${texteNiveau(d.voies.pratiques.niveau)}`);
    else if (d.voies.pratiques.manquants?.length) lignes.push("Pratiques : informations à compléter");
    else lignes.push("Pratiques : niveau de base non atteint");
    if (d.voies.certification.eligible) lignes.push(`Certification : ${texteNiveau(d.voies.certification.niveau)}`);
    if (d.voies.biodiversite.eligible) lignes.push(`Biodiversité : ${texteNiveau(d.voies.biodiversite.niveau)}`);
    else if (d.voies.biodiversite.iae?.ratioSAU !== null && d.voies.biodiversite.iae?.donneesComplete) lignes.push(`Biodiversité : ${Math.round(d.voies.biodiversite.iae.ratioSAU * 1000) / 10} % IAE/jachères`);
    const meilleur = d.meilleureVoie ? `Meilleure voie détectée : ${d.meilleureVoie.voie} — ${texteNiveau(d.meilleureVoie.niveau)}` : "Aucune voie confirmée pour l'instant";
    return `<div class="live-result ${d.meilleureVoie ? "ok" : "pending"}"><strong>${meilleur}</strong><span>Score diversification : ${score.points} point(s). ${lignes.join(" · ")}${d.bonusHaies.possible ? " · Bonus haies potentiellement accessible." : ""}</span></div>`;
}

function htmlPanneauSynthese() {
    const d = calculerIndicateursPAC();
    const eco = d.ecoregime.meilleureVoie ? `${d.ecoregime.meilleureVoie.voie} / ${texteNiveau(d.ecoregime.meilleureVoie.niveau)}` : "à compléter";
    const actif = d.agriculteurActif.statut === true ? "compatible" : d.agriculteurActif.statut === false ? "non" : "à compléter";
    return `<div class="live-result info"><strong>Pré-diagnostic automatique</strong><span>Agriculteur actif : ${actif} · Écorégime : ${eco} · UGB bovines : ${Math.round(d.bovins.total * 10) / 10} · Secteurs détectés : ${d.secteursPresents.length ? d.secteursPresents.join(", ") : "aucun"}</span></div>`;
}

function mettreAJourPanneau() {
    const zone = document.getElementById("live-calculation");
    if (!zone) return;
    const etape = ETAPES_QUESTIONNAIRE[etapeQuestionnaire];
    if (etape.panneau === "actif") zone.innerHTML = htmlPanneauActif();
    else if (etape.panneau === "assolement") zone.innerHTML = htmlPanneauAssolement();
    else if (etape.panneau === "elevage") zone.innerHTML = htmlPanneauElevage();
    else if (etape.panneau === "ecoregime") zone.innerHTML = htmlPanneauEcoregime();
    else if (etape.panneau === "synthese") zone.innerHTML = htmlPanneauSynthese();
    else zone.innerHTML = "";
    zone.style.display = zone.innerHTML ? "block" : "none";
}

/* =========================================================
   NAVIGATION
========================================================= */

function afficherNavigationLaterale() {
    const navigation = document.getElementById("sidebar-steps");
    if (!navigation) return;
    navigation.innerHTML = "";
    ETAPES_QUESTIONNAIRE.forEach((etape, index) => {
        const bouton = document.createElement("button");
        bouton.type = "button";
        bouton.className = "sidebar-step";
        if (!affichageResultats && index === etapeQuestionnaire) bouton.classList.add("active");
        if (index < etapeQuestionnaire || affichageResultats) bouton.classList.add("completed");
        bouton.innerHTML = `<span class="step-indicator">${index < etapeQuestionnaire || affichageResultats ? "✓" : index + 1}</span><span>${etape.titre}</span>`;
        bouton.addEventListener("click", () => {
            affichageResultats = false;
            etapeQuestionnaire = index;
            document.getElementById("results").style.display = "none";
            document.getElementById("questionnaire-card").style.display = "block";
            afficherEtape();
        });
        navigation.appendChild(bouton);
    });

    const resultat = document.createElement("button");
    resultat.type = "button";
    resultat.className = `sidebar-step ${affichageResultats ? "active" : ""}`;
    resultat.innerHTML = `<span class="step-indicator">${affichageResultats ? "✓" : ETAPES_QUESTIONNAIRE.length + 1}</span><span>Mon diagnostic PAC</span>`;
    if (!affichageResultats) {
        resultat.disabled = true;
        resultat.setAttribute("aria-disabled", "true");
    }
    navigation.appendChild(resultat);
}

function afficherEtape() {
    affichageResultats = false;
    const etape = ETAPES_QUESTIONNAIRE[etapeQuestionnaire];
    afficherNavigationLaterale();
    document.getElementById("question-title").textContent = etape.titre;
    document.getElementById("question-subtitle").textContent = etape.sousTitre;

    const zone = document.getElementById("questions-container");
    zone.innerHTML = "";
    etape.questions.forEach(question => {
        if (question.afficherSi && !question.afficherSi()) return;
        zone.appendChild(creerChampQuestion(question));
    });

    mettreAJourPanneau();

    const pourcentage = ((etapeQuestionnaire + 1) / ETAPES_QUESTIONNAIRE.length) * 100;
    document.getElementById("progress-bar").style.width = `${pourcentage}%`;
    document.getElementById("step-counter").textContent = `Rubrique ${etapeQuestionnaire + 1} sur ${ETAPES_QUESTIONNAIRE.length}`;
    document.getElementById("previous-button").style.display = etapeQuestionnaire === 0 ? "none" : "inline-flex";
    document.getElementById("next-button").textContent = etapeQuestionnaire === ETAPES_QUESTIONNAIRE.length - 1 ? "Calculer mon diagnostic" : "Enregistrer et continuer →";
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function etapeSuivante() {
    sauvegarderProfilLocalement();
    if (etapeQuestionnaire < ETAPES_QUESTIONNAIRE.length - 1) {
        etapeQuestionnaire += 1;
        afficherEtape();
    } else {
        afficherResultatsQuestionnaire();
    }
}

function etapePrecedente() {
    if (etapeQuestionnaire > 0) {
        etapeQuestionnaire -= 1;
        afficherEtape();
    }
}

/* =========================================================
   RÉSULTATS
========================================================= */

function libelleTypeCalcul(type) {
    return {
        donnee_exploitation: "Donnée réelle de l'exploitation",
        reference_2024: "Estimation avec référence 2024",
        reference_2025: "Estimation avec référence 2025",
        regle_guide: "Calcul selon le barème du guide",
        partiel: "Calcul partiel / à confirmer",
        non_calculable: "Montant non calculable avec les données disponibles"
    }[type] || type;
}

function creerCarteResultat(resultat, calcul) {
    const carte = document.createElement("article");
    carte.className = `result-card ${resultat.statut === STATUT_AIDE.A_EXAMINER ? "success" : "warning"}`;
    const montant = calcul && calcul.montant !== null
        ? `<div class="result-amount">${calcul.montantFormate}</div><div class="result-reference">${libelleTypeCalcul(calcul.type)}</div>`
        : `<div class="result-reference">${calcul ? libelleTypeCalcul(calcul.type) : ""}</div>`;
    const raisons = resultat.raisons.length ? `<div class="result-details"><strong>Pourquoi cette aide apparaît ?</strong>${resultat.raisons.map(r => `<p>✓ ${r}</p>`).join("")}</div>` : "";
    const manquants = resultat.informationsManquantes.length ? `<div class="result-details"><strong>Informations à compléter</strong>${resultat.informationsManquantes.map(r => `<p>• ${r}</p>`).join("")}</div>` : "";
    const avertissements = [...new Set([...(resultat.verifications || []), ...((calcul && calcul.avertissements) || [])])];
    const warnings = avertissements.length ? `<div class="result-warnings">${avertissements.map(a => `<p>${a}</p>`).join("")}</div>` : "";
    carte.innerHTML = `
        <div class="result-status">${resultat.statut === STATUT_AIDE.A_EXAMINER ? "À EXAMINER" : "À COMPLÉTER"}</div>
        <h3>${resultat.nom}</h3>
        ${montant}${raisons}${manquants}${warnings}
        <div class="result-source">Source : ${resultat.source}</div>`;
    return carte;
}

function afficherBlocDiagnostic(zone) {
    const d = calculerIndicateursPAC();
    const eco = d.ecoregime;
    const bloc = document.createElement("section");
    bloc.className = "diagnostic-summary";
    bloc.innerHTML = `
        <div><span>Agriculteur actif</span><strong>${d.agriculteurActif.statut === true ? "Compatible" : d.agriculteurActif.statut === false ? "Non" : "À compléter"}</strong></div>
        <div><span>Score diversification</span><strong>${eco.scoreDiversification.points} point(s)</strong></div>
        <div><span>Écorégime</span><strong>${eco.meilleureVoie ? `${eco.meilleureVoie.voie} · ${texteNiveau(eco.meilleureVoie.niveau)}` : "À compléter / non atteint"}</strong></div>
        <div><span>UGB bovines calculées</span><strong>${Math.round(d.bovins.total * 10) / 10}</strong></div>`;
    zone.appendChild(bloc);
}

function afficherSyntheseMontants(zone) {
    const synthese = calculerSyntheseFinanciere();
    const valeurs = [
        ["Données réelles exploitation", synthese.donneeExploitation],
        ["Estimations avec références 2024", synthese.reference2024],
        ["Estimations avec références 2025", synthese.reference2025],
        ["Barèmes du guide", synthese.regleGuide],
        ["Calculs partiels", synthese.partiel]
    ].filter(([, montant]) => montant > 0);
    if (!valeurs.length) return;
    const grille = document.createElement("div");
    grille.className = "summary-grid";
    valeurs.forEach(([libelle, montant]) => {
        const card = document.createElement("div");
        card.className = "summary-card";
        card.innerHTML = `<span>${libelle}</span><strong>${formaterMontant(montant)}</strong>`;
        grille.appendChild(card);
    });
    zone.appendChild(grille);
    const note = document.createElement("p");
    note.className = "summary-note";
    note.textContent = "Ces blocs correspondent à des natures de montants différentes. Les références 2024/2025 ne doivent pas être présentées comme des taux courants ni additionnées automatiquement à des montants définitifs.";
    zone.appendChild(note);
}

function afficherResultatsQuestionnaire() {
    affichageResultats = true;
    afficherNavigationLaterale();
    const questionnaire = document.getElementById("questionnaire-card");
    const zone = document.getElementById("results");
    questionnaire.style.display = "none";
    zone.style.display = "block";
    zone.innerHTML = "";

    const orientations = analyserToutesLesAides();
    const calculs = calculerToutesLesAides();
    const aExaminer = orientations.filter(r => r.statut === STATUT_AIDE.A_EXAMINER);
    const incompletes = orientations.filter(r => r.statut === STATUT_AIDE.INFORMATIONS_MANQUANTES);
    const nonRetenues = orientations.filter(r => r.statut === STATUT_AIDE.NON_RETENUE);

    const header = document.createElement("div");
    header.className = "results-header";
    header.innerHTML = `<span class="context-label">MON DIAGNOSTIC PAC</span><h2>${aExaminer.length} dispositif${aExaminer.length > 1 ? "s" : ""} à examiner</h2><p>Le moteur a déduit les résultats à partir de la description de l'exploitation. Vous n'avez pas eu à choisir vous-même une voie écorégime, un nombre de points ou des UGB bovines.</p>`;
    zone.appendChild(header);

    afficherBlocDiagnostic(zone);
    afficherSyntheseMontants(zone);

    aExaminer.forEach(resultat => zone.appendChild(creerCarteResultat(resultat, calculs.find(c => c.id === resultat.id))));

    if (incompletes.length) {
        const titre = document.createElement("h3");
        titre.className = "results-section-title";
        titre.textContent = "Informations utiles à compléter";
        zone.appendChild(titre);
        incompletes.forEach(resultat => zone.appendChild(creerCarteResultat(resultat, calculs.find(c => c.id === resultat.id))));
    }

    if (nonRetenues.length) {
        const details = document.createElement("details");
        details.className = "not-retained";
        details.innerHTML = `<summary>${nonRetenues.length} dispositif(s) non retenu(s) avec les informations actuelles</summary>`;
        nonRetenues.forEach(resultat => {
            const ligne = document.createElement("div");
            ligne.className = "not-retained-item";
            ligne.innerHTML = `<strong>${resultat.nom}</strong>${resultat.verifications.length ? `<span>${resultat.verifications[0]}</span>` : ""}`;
            details.appendChild(ligne);
        });
        zone.appendChild(details);
    }

    const actions = document.createElement("div");
    actions.className = "results-actions";
    actions.innerHTML = `<button type="button" class="button button-secondary" id="edit-results-button">Modifier mon dossier</button><button type="button" class="button button-secondary" id="reset-results-button">Recommencer à zéro</button>`;
    zone.appendChild(actions);
    document.getElementById("edit-results-button").addEventListener("click", () => {
        affichageResultats = false;
        zone.style.display = "none";
        questionnaire.style.display = "block";
        etapeQuestionnaire = 0;
        afficherEtape();
    });
    document.getElementById("reset-results-button").addEventListener("click", () => {
        reinitialiserProfil();
        affichageResultats = false;
        etapeQuestionnaire = 0;
        zone.style.display = "none";
        questionnaire.style.display = "block";
        afficherEtape();
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function initialiserQuestionnaire() {
    chargerProfilLocal();
    afficherEtape();
    const suivant = document.getElementById("next-button");
    const precedent = document.getElementById("previous-button");
    const reset = document.getElementById("reset-button");
    if (suivant) suivant.addEventListener("click", etapeSuivante);
    if (precedent) precedent.addEventListener("click", etapePrecedente);
    if (reset) reset.addEventListener("click", () => {
        if (!confirm("Effacer toutes les réponses enregistrées dans ce navigateur ?")) return;
        reinitialiserProfil();
        etapeQuestionnaire = 0;
        affichageResultats = false;
        document.getElementById("results").style.display = "none";
        document.getElementById("questionnaire-card").style.display = "block";
        afficherEtape();
    });
}
