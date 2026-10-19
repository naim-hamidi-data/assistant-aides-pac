/* =========================================================
   QUESTIONNAIRE DYNAMIQUE
========================================================= */

let etapeQuestionnaire = 0;
let affichageResultats = false;

function positif(chemin) {
    return nombreOuZero(lireProfil(chemin)) > 0;
}

function estGAEC() {
    return lireProfil("general.statutJuridique") === "GAEC";
}

function aDPB() {
    return lireProfil("dpb.detientDPB") === true;
}

function surfaceSignificative(chemin) {
    const surface = nombreOuZero(lireProfil(chemin));
    const admissible = nombreOuZero(lireProfil("surfaces.surfaceAdmissible"));
    return admissible > 0 && surface / admissible >= 0.05;
}

function estEnZoneICHN() {
    return lireProfil("ichn.zoneEligible") === true;
}

function aICHNAnimale() {
    return lireProfil("ichn.aideAnimale") === true;
}

function aICHNVegetale() {
    return lireProfil("ichn.aideVegetale") === true;
}

function estICHNHorsMontagne() {
    return ["piemont", "zone_defavorisee_simple"].includes(lireProfil("ichn.typeZone"));
}

function enConversionBio() {
    return lireProfil("conversionBio.enConversion") === true;
}

function souhaiteMAEC() {
    return lireProfil("maec.souhaiteExaminer") === true;
}

function aBovins() {
    return lireProfil("bovins.present") === true;
}

function aVeaux() {
    return lireProfil("veauxQualite.present") === true;
}

function aOvins() {
    return lireProfil("ovins.present") === true;
}

function aCaprins() {
    return lireProfil("caprins.present") === true;
}

function estCorseProfil() {
    return lireProfil("general.territoire") === "Corse";
}

function premiereInstallation() {
    return lireProfil("installation.premiereInstallation") === true;
}

function programmeSectorielConcerne() {
    return lireProfil("programmesSectoriels.concerne") === true;
}

function programmeSectorielOPAOP() {
    return ["fruits_legumes", "huile_olive", "proteines", "horticulture", "veau_label", "lapin", "riz"].includes(lireProfil("programmesSectoriels.secteur"));
}

function souhaiteRegional() {
    return lireProfil("regional.souhaiteExaminer") === true;
}

function q(chemin, label, type = "number", options = {}) {
    return { chemin, label, type, ...options };
}

const OUI_NON_INCONNU = [
    { valeur: "", texte: "Je ne sais pas" },
    { valeur: "true", texte: "Oui" },
    { valeur: "false", texte: "Non" }
];

const ETAPES_QUESTIONNAIRE = [
    {
        titre: "Votre exploitation",
        sousTitre: "Informations générales utilisées par les différents dispositifs.",
        questions: [
            q("general.territoire", "Territoire principal", "select", {
                options: [
                    { valeur: "Hexagone", texte: "France métropolitaine hors Corse" },
                    { valeur: "Corse", texte: "Corse" },
                    { valeur: "Outre-mer", texte: "Outre-mer – orientation partielle seulement" }
                ],
                refreshOnChange: true
            }),
            q("general.region", "Région", "text", { placeholder: "Ex. Occitanie" }),
            q("general.departement", "Département", "text", { placeholder: "Ex. Haute-Garonne" }),
            q("general.statutJuridique", "Statut juridique", "select", {
                options: [
                    { valeur: "", texte: "Sélectionner" },
                    { valeur: "individuel", texte: "Exploitant individuel" },
                    { valeur: "GAEC", texte: "GAEC" },
                    { valeur: "EARL", texte: "EARL" },
                    { valeur: "SCEA", texte: "SCEA" },
                    { valeur: "SAS", texte: "SAS" },
                    { valeur: "SARL", texte: "SARL" },
                    { valeur: "SA", texte: "SA" },
                    { valeur: "autre", texte: "Autre" }
                ],
                refreshOnChange: true
            }),
            q("general.gaecTotal", "S'agit-il d'un GAEC total ?", "yesno", { afficherSi: estGAEC }),
            q("general.nombreAssocies", "Nombre d'associés", "number", { min: 1, afficherSi: estGAEC }),
            q("agriculteurActif.statut", "Le demandeur répond-il à la définition d'agriculteur actif au sens de la PAC ?", "select", {
                options: OUI_NON_INCONNU,
                aide: "Cette V1 utilise cette réponse comme critère transversal. Un contrôle détaillé du statut pourra être ajouté ensuite."
            })
        ]
    },

    {
        titre: "Surfaces et DPB",
        sousTitre: "Base de calcul des paiements découplés et de plusieurs autres aides.",
        questions: [
            q("surfaces.sau", "SAU totale", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("surfaces.surfaceAdmissible", "Surface admissible PAC", "number", { suffixe: "ha", min: 0, step: 0.01, refreshOnChange: true }),
            q("surfaces.terresArables", "Terres arables", "number", { suffixe: "ha", min: 0, step: 0.01, refreshOnChange: true }),
            q("surfaces.prairiesPermanentes", "Prairies permanentes", "number", { suffixe: "ha", min: 0, step: 0.01, refreshOnChange: true }),
            q("surfaces.culturesPermanentes", "Cultures permanentes", "number", { suffixe: "ha", min: 0, step: 0.01, refreshOnChange: true }),
            q("surfaces.surfaceFourragere", "Surface fourragère totale", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("dpb.detientDPB", "L'exploitation détient-elle des DPB ?", "yesno", { refreshOnChange: true }),
            q("dpb.nombreDPB", "Nombre de DPB détenus", "number", { min: 0, step: 0.01, afficherSi: aDPB }),
            q("dpb.nombreDPBActives", "Nombre de DPB activés ou activables", "number", { min: 0, step: 0.01, afficherSi: aDPB }),
            q("dpb.valeurMoyenneDPB", "Valeur moyenne réelle des DPB", "number", { suffixe: "€/DPB", min: 0, step: 0.01, afficherSi: aDPB, aide: "Laissez vide si inconnue." }),
            q("dpb.valeurTotaleDPB", "Valeur totale des DPB activés, si connue", "number", { suffixe: "€", min: 0, step: 0.01, afficherSi: aDPB, aide: "Si cette valeur est renseignée, elle est prioritaire pour le calcul de l'aide de base." })
        ]
    },

    {
        titre: "Écorégime et jeune agriculteur",
        sousTitre: "Pratiques, certifications, biodiversité, haies et installation.",
        questions: [
            q("ecoregime.pointsDiversification", "Points de diversification des cultures", "number", { min: 0, max: 5, step: 1, afficherSi: () => surfaceSignificative("surfaces.terresArables"), aide: "4 points = niveau de base ; 5 points = niveau supérieur selon le guide." }),
            q("ecoregime.pourcentagePrairiesNonLabourees", "Part des prairies permanentes non labourées", "number", { suffixe: "%", min: 0, max: 100, step: 0.1, afficherSi: () => surfaceSignificative("surfaces.prairiesPermanentes") }),
            q("ecoregime.pourcentageInterRangsCouverts", "Part des inter-rangs couverts en cultures permanentes", "number", { suffixe: "%", min: 0, max: 100, step: 0.1, afficherSi: () => surfaceSignificative("surfaces.culturesPermanentes") }),
            q("environnement.agricultureBiologique", "Toute l'exploitation est-elle certifiée AB ?", "yesno"),
            q("environnement.hveRenovee", "Certification HVE rénovée ?", "yesno"),
            q("environnement.certificationCE2Plus", "Certification CE2+ reconnue ?", "yesno"),
            q("ecoregime.pourcentageIAEEtJacheresSAU", "IAE et jachères dans la SAU", "number", { suffixe: "%", min: 0, max: 100, step: 0.01 }),
            q("surfaces.pourcentageHaiesSAU", "Haies sur la SAU admissible", "number", { suffixe: "%", min: 0, max: 100, step: 0.01 }),
            q("surfaces.pourcentageHaiesTerresArables", "Haies sur les terres arables", "number", { suffixe: "%", min: 0, max: 100, step: 0.01, afficherSi: () => surfaceSignificative("surfaces.terresArables") }),
            q("environnement.certificationGestionDurableHaies", "Certification reconnue de gestion durable des haies ?", "yesno"),
            q("environnement.maecEntretienLigneux", "Êtes-vous engagé en MAEC Biodiversité – entretien des ligneux ?", "yesno"),

            q("installation.premiereInstallation", "Première installation récente ?", "yesno", { refreshOnChange: true }),
            q("installation.age", "Âge du jeune agriculteur / associé concerné", "number", { min: 18, max: 100, afficherSi: premiereInstallation }),
            q("installation.anneeInstallation", "Année de première installation", "number", { min: 1900, max: 2026, afficherSi: premiereInstallation }),
            q("installation.diplomeAgricoleNiveau4OuPlus", "Diplôme agricole de niveau 4 ou supérieur ?", "yesno", { afficherSi: premiereInstallation }),
            q("installation.diplomeNiveau3OuPlus", "Diplôme de niveau 3 ou supérieur, quelle que soit la spécialité ?", "yesno", { afficherSi: premiereInstallation }),
            q("installation.experienceAgricoleMois", "Expérience professionnelle agricole", "number", { suffixe: "mois", min: 0, afficherSi: premiereInstallation }),
            q("installation.nombreAssociesJAEligibles", "Nombre d'associés JA potentiellement éligibles", "number", { min: 0, afficherSi: () => premiereInstallation() && estGAEC(), aide: "Utilisé pour une estimation prudente de la transparence GAEC." })
        ]
    },

    {
        titre: "Productions végétales",
        sousTitre: "Renseignez 0 lorsqu'une production n'est pas présente. Des questions complémentaires apparaissent selon les surfaces.",
        questions: [
            q("productionsVegetales.legumineusesGraines.surface", "Légumineuses à graines / déshydratation / semences", "number", { suffixe: "ha", min: 0, step: 0.01, refreshOnChange: true }),
            q("productionsVegetales.legumineusesGraines.destination", "Destination principale", "select", { afficherSi: () => positif("productionsVegetales.legumineusesGraines.surface"), options: [
                { valeur: "", texte: "Sélectionner" }, { valeur: "graines", texte: "Graines / protéagineux / soja / légumes secs" }, { valeur: "deshydratation", texte: "Déshydratation" }, { valeur: "semences", texte: "Production de semences" }
            ], refreshOnChange: true }),
            q("productionsVegetales.legumineusesGraines.contratDeshydratation", "Contrat avec une entreprise de déshydratation ?", "yesno", { afficherSi: () => lireProfil("productionsVegetales.legumineusesGraines.destination") === "deshydratation" }),
            q("productionsVegetales.legumineusesGraines.melangeProteagineuxPourcent", "Si mélange céréales/protéagineux : part de protéagineux", "number", { suffixe: "%", min: 0, max: 100, afficherSi: () => positif("productionsVegetales.legumineusesGraines.surface"), aide: "Laissez vide si ce n'est pas un mélange." }),

            q("productionsVegetales.legumineusesFourrageres.surface", "Légumineuses fourragères", "number", { suffixe: "ha", min: 0, step: 0.01, refreshOnChange: true }),
            q("productionsVegetales.legumineusesFourrageres.zone", "Zone des légumineuses fourragères", "select", { afficherSi: () => positif("productionsVegetales.legumineusesFourrageres.surface"), options: [
                { valeur: "", texte: "Sélectionner" }, { valeur: "plaine_piemont", texte: "Plaine / piémont" }, { valeur: "montagne", texte: "Montagne / haute montagne" }
            ] }),
            q("productionsVegetales.legumineusesFourrageres.ugb", "UGB détenues pour ce critère", "number", { min: 0, step: 0.1, afficherSi: () => positif("productionsVegetales.legumineusesFourrageres.surface") }),
            q("productionsVegetales.legumineusesFourrageres.contratEleveur5UGB", "Contrat direct avec un éleveur détenant au moins 5 UGB ?", "yesno", { afficherSi: () => positif("productionsVegetales.legumineusesFourrageres.surface") }),
            q("productionsVegetales.legumineusesFourrageres.melangeLegumineusesPourcent", "Si mélange : part de légumineuses à l'implantation", "number", { suffixe: "%", min: 0, max: 100, afficherSi: () => positif("productionsVegetales.legumineusesFourrageres.surface"), aide: "Laissez vide si culture pure." }),
            q("productionsVegetales.legumineusesFourrageres.melangeAvecGraminees", "Mélange légumineuses / graminées ?", "yesno", { afficherSi: () => positif("productionsVegetales.legumineusesFourrageres.surface"), refreshOnChange: true }),
            q("productionsVegetales.legumineusesFourrageres.anneeSemis", "S'agit-il de l'année du semis ?", "yesno", { afficherSi: () => lireProfil("productionsVegetales.legumineusesFourrageres.melangeAvecGraminees") === true }),

            q("productionsVegetales.bleDur.surface", "Blé dur", "number", { suffixe: "ha", min: 0, step: 0.01, refreshOnChange: true }),
            q("productionsVegetales.bleDur.contratCollecteur", "Contrat annuel de livraison avec un collecteur ?", "yesno", { afficherSi: () => positif("productionsVegetales.bleDur.surface") }),

            q("productionsVegetales.pommeTerreFeculiere.surface", "Pommes de terre féculières", "number", { suffixe: "ha", min: 0, step: 0.01, refreshOnChange: true }),
            q("productionsVegetales.pommeTerreFeculiere.contratTransformation", "Contrat de culture avec transformation / OP / coopérative ?", "yesno", { afficherSi: () => positif("productionsVegetales.pommeTerreFeculiere.surface") }),

            q("productionsVegetales.riz.surface", "Riz", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("productionsVegetales.houblon.surface", "Houblon", "number", { suffixe: "ha", min: 0, step: 0.01 }),

            q("productionsVegetales.semencesGraminees.surface", "Semences de graminées prairiales", "number", { suffixe: "ha", min: 0, step: 0.01, refreshOnChange: true }),
            q("productionsVegetales.semencesGraminees.contratCulture", "Contrat de culture ?", "yesno", { afficherSi: () => positif("productionsVegetales.semencesGraminees.surface") }),
            q("productionsVegetales.semencesGraminees.varieteAutorisee", "Variété autorisée / cataloguée ?", "yesno", { afficherSi: () => positif("productionsVegetales.semencesGraminees.surface") }),
            q("productionsVegetales.semencesGraminees.usageGazonUniquement", "Production destinée uniquement au gazon ?", "yesno", { afficherSi: () => positif("productionsVegetales.semencesGraminees.surface") }),

            q("productionsVegetales.chanvre.surface", "Chanvre", "number", { suffixe: "ha", min: 0, step: 0.01, refreshOnChange: true }),
            q("productionsVegetales.chanvre.contratTransformationOuSemences", "Contrat de transformation ou de semences certifiées ?", "yesno", { afficherSi: () => positif("productionsVegetales.chanvre.surface") }),
            q("productionsVegetales.chanvre.thcConforme", "Conditions réglementaires relatives au chanvre respectées ?", "yesno", { afficherSi: () => positif("productionsVegetales.chanvre.surface") }),

            q("productionsVegetales.maraichage.surfaceLegumesFrais", "Légumes frais éligibles au petit maraîchage", "number", { suffixe: "ha", min: 0, step: 0.01 }),
            q("productionsVegetales.maraichage.surfacePetitsFruitsRouges", "Petits fruits rouges", "number", { suffixe: "ha", min: 0, step: 0.01 }),

            q("productionsVegetales.fruitsTransformes.pruneEnte", "Prune d'Ente destinée à la transformation", "number", { suffixe: "ha", min: 0, step: 0.01, refreshOnChange: true }),
            q("productionsVegetales.fruitsTransformes.ceriseBigarreau", "Cerise Bigarreau destinée à la transformation", "number", { suffixe: "ha", min: 0, step: 0.01, refreshOnChange: true }),
            q("productionsVegetales.fruitsTransformes.poireWilliams", "Poire Williams destinée à la transformation", "number", { suffixe: "ha", min: 0, step: 0.01, refreshOnChange: true }),
            q("productionsVegetales.fruitsTransformes.pechePavie", "Pêche Pavie destinée à la transformation", "number", { suffixe: "ha", min: 0, step: 0.01, refreshOnChange: true }),
            q("productionsVegetales.fruitsTransformes.tomateIndustrie", "Tomate d'industrie", "number", { suffixe: "ha", min: 0, step: 0.01, refreshOnChange: true }),
            q("productionsVegetales.fruitsTransformes.deboucheIndustriel", "Adhésion OP reconnue ou contrat avec une usine de transformation ?", "yesno", { afficherSi: () => sommeSurfacesFruitsTransformes() > 0 })
        ]
    },

    {
        titre: "Élevage",
        sousTitre: "Aides bovines, veaux de qualité, ovins, caprins et cas Corse.",
        questions: [
            q("bovins.present", "Avez-vous un atelier bovin ?", "yesno", { refreshOnChange: true }),
            q("bovins.ugbTotal", "UGB bovines totales à la date de référence", "number", { min: 0, step: 0.1, afficherSi: aBovins }),
            q("bovins.ugbNiveauSuperieur", "UGB potentiellement au niveau supérieur", "number", { min: 0, step: 0.1, afficherSi: aBovins }),
            q("bovins.ugbNiveauBase", "UGB potentiellement au niveau de base", "number", { min: 0, step: 0.1, afficherSi: aBovins }),
            q("bovins.animauxDetenus6Mois", "Animaux concernés détenus au moins 6 mois ?", "yesno", { afficherSi: aBovins }),
            q("bovins.identificationConforme", "Identification / enregistrement conformes ?", "yesno", { afficherSi: aBovins }),

            q("veauxQualite.present", "Produisez-vous des veaux sous la mère / bio éligibles ?", "yesno", { refreshOnChange: true, afficherSi: () => !estCorseProfil() }),
            q("veauxQualite.nombreVeauxEligibles", "Nombre de veaux potentiellement éligibles", "number", { min: 0, afficherSi: aVeaux }),
            q("veauxQualite.labelRouge", "Label rouge ?", "yesno", { afficherSi: aVeaux }),
            q("veauxQualite.igpRoseePyreneesCatalanes", "IGP Rosée des Pyrénées Catalanes ?", "yesno", { afficherSi: aVeaux }),
            q("veauxQualite.agricultureBiologique", "Veaux en agriculture biologique ?", "yesno", { afficherSi: aVeaux }),
            q("veauxQualite.detention45Jours", "Détention minimale de 45 jours respectée ?", "yesno", { afficherSi: aVeaux }),
            q("veauxQualite.identificationConforme", "Identification conforme ?", "yesno", { afficherSi: aVeaux }),

            q("ovins.present", "Atelier ovin ?", "yesno", { refreshOnChange: true, afficherSi: () => !estCorseProfil() }),
            q("ovins.nombreBrebis", "Nombre de brebis", "number", { min: 0, afficherSi: aOvins }),
            q("ovins.nombreBrebisPresentes1JanvierNMoins1", "Brebis présentes au 1er janvier N-1", "number", { min: 0, afficherSi: aOvins }),
            q("ovins.nombreAgneauxVendusNMoins1", "Agneaux vendus en N-1", "number", { min: 0, afficherSi: aOvins }),
            q("ovins.nouveauProducteur", "Nouvel atelier ovin depuis moins de 3 ans ?", "yesno", { afficherSi: aOvins }),
            q("ovins.detention100Jours", "Détention pendant 100 jours respectée ?", "yesno", { afficherSi: aOvins }),
            q("ovins.identificationConforme", "Identification conforme ?", "yesno", { afficherSi: aOvins }),

            q("caprins.present", "Atelier caprin ?", "yesno", { refreshOnChange: true, afficherSi: () => !estCorseProfil() }),
            q("caprins.nombreChevres", "Nombre de chèvres", "number", { min: 0, afficherSi: aCaprins }),
            q("caprins.detention100Jours", "Détention pendant 100 jours respectée ?", "yesno", { afficherSi: aCaprins }),
            q("caprins.identificationConforme", "Identification conforme ?", "yesno", { afficherSi: aCaprins }),

            q("petitsRuminantsCorse.nombreBrebis", "Corse – nombre de brebis", "number", { min: 0, afficherSi: estCorseProfil }),
            q("petitsRuminantsCorse.nombreChevres", "Corse – nombre de chèvres", "number", { min: 0, afficherSi: estCorseProfil }),
            q("petitsRuminantsCorse.sousAOPBrocciu", "Atelier sous AOP Brocciu ?", "yesno", { afficherSi: estCorseProfil }),
            q("petitsRuminantsCorse.detention100Jours", "Détention 100 jours respectée ?", "yesno", { afficherSi: estCorseProfil }),
            q("petitsRuminantsCorse.identificationConforme", "Identification conforme ?", "yesno", { afficherSi: estCorseProfil })
        ]
    },

    {
        titre: "ICHN, conversion bio et MAEC",
        sousTitre: "Aides surfaciques du développement rural.",
        questions: [
            q("ichn.zoneEligible", "Avez-vous des surfaces en zone éligible à l'ICHN ?", "select", { options: OUI_NON_INCONNU, refreshOnChange: true }),
            q("ichn.typeZone", "Type de zone ICHN", "select", { afficherSi: estEnZoneICHN, options: [
                { valeur: "", texte: "Sélectionner" }, { valeur: "haute_montagne", texte: "Haute montagne" }, { valeur: "montagne", texte: "Montagne" }, { valeur: "piemont", texte: "Piémont" }, { valeur: "zone_defavorisee_simple", texte: "Zone défavorisée simple / autre hors montagne" }
            ], refreshOnChange: true }),
            q("ichn.pourcentageSAUZoneDefavorisee", "Part de la SAU située en zone défavorisée", "number", { suffixe: "%", min: 0, max: 100, afficherSi: estEnZoneICHN }),
            q("ichn.partRevenuAgricolePourcent", "Part du revenu provenant de l'activité agricole", "number", { suffixe: "%", min: 0, max: 100, afficherSi: estEnZoneICHN }),
            q("ichn.siegeEnZoneDefavorisee", "Siège d'exploitation situé en zone défavorisée ?", "yesno", { afficherSi: () => estEnZoneICHN() && estICHNHorsMontagne() }),
            q("ichn.aideAnimale", "Surfaces fourragères en zone défavorisée ?", "yesno", { afficherSi: estEnZoneICHN, refreshOnChange: true }),
            q("ichn.surfacesFourrageresEligibles", "Surface fourragère en zone défavorisée", "number", { suffixe: "ha", min: 0, step: 0.01, afficherSi: aICHNAnimale }),
            q("ichn.ugb", "UGB retenues pour l'ICHN", "number", { suffixe: "UGB", min: 0, step: 0.1, afficherSi: aICHNAnimale }),
            q("ichn.aideVegetale", "Cultures de vente en zone de montagne ?", "yesno", { afficherSi: estEnZoneICHN, refreshOnChange: true }),
            q("ichn.surfacesVegetalesEligibles", "Surface de cultures de vente en montagne", "number", { suffixe: "ha", min: 0, step: 0.01, afficherSi: aICHNVegetale }),
            q("ichn.zoneSeche", "Ces surfaces sont-elles en zone sèche ?", "select", { options: OUI_NON_INCONNU, afficherSi: aICHNVegetale }),

            q("conversionBio.enConversion", "Avez-vous des surfaces engagées en conversion à l'agriculture biologique ?", "yesno", { refreshOnChange: true }),
            q("conversionBio.premiereOuDeuxiemeAnnee", "Ces surfaces sont-elles en première ou deuxième année de conversion ?", "yesno", { afficherSi: enConversionBio }),
            q("conversionBio.landesEstivesParcours", "CAB – landes, estives et parcours avec atelier d'élevage", "number", { suffixe: "ha", min: 0, step: 0.01, afficherSi: enConversionBio }),
            q("conversionBio.prairiesAvecElevage", "CAB – prairies avec atelier d'élevage", "number", { suffixe: "ha", min: 0, step: 0.01, afficherSi: enConversionBio }),
            q("conversionBio.culturesAnnuellesLegumineusesJacheresSemences", "CAB – cultures annuelles, légumineuses, jachères et semences", "number", { suffixe: "ha", min: 0, step: 0.01, afficherSi: enConversionBio }),
            q("conversionBio.viticulture", "CAB – surfaces viticoles", "number", { suffixe: "ha", min: 0, step: 0.01, afficherSi: enConversionBio }),
            q("conversionBio.ppamListees", "CAB – PPAM listées à 350 €/ha", "number", { suffixe: "ha", min: 0, step: 0.01, afficherSi: enConversionBio }),
            q("conversionBio.legumesPleinChampBetterave", "CAB – légumes de plein champ et betterave sucrière", "number", { suffixe: "ha", min: 0, step: 0.01, afficherSi: enConversionBio }),
            q("conversionBio.maraichageArboricultureAutresPpamSemences", "CAB – maraîchage, arboriculture, autres PPAM et semences concernées", "number", { suffixe: "ha", min: 0, step: 0.01, afficherSi: enConversionBio }),

            q("maec.souhaiteExaminer", "Souhaitez-vous examiner les MAEC surfaciques ?", "yesno", { refreshOnChange: true }),
            q("maec.offreLocaleConnue", "Savez-vous si une MAEC est ouverte localement ?", "yesno", { afficherSi: souhaiteMAEC }),
            q("maec.type", "Type de MAEC envisagé", "select", { afficherSi: souhaiteMAEC, options: [
                { valeur: "", texte: "Je ne sais pas" }, { valeur: "systeme", texte: "Mesure système" }, { valeur: "localisee", texte: "Mesure localisée à la parcelle" }, { valeur: "inconnue", texte: "À déterminer" }
            ] })
        ]
    },

    {
        titre: "Risques, prédation et autres dispositifs",
        sousTitre: "Dispositifs qui nécessitent souvent des paramètres locaux ou sectoriels.",
        questions: [
            q("assurance.souscritMRC", "Avez-vous souscrit une assurance multirisques climatique des récoltes ?", "yesno", { refreshOnChange: true }),
            q("assurance.primeAnnuelle", "Prime ou cotisation annuelle MRC", "number", { suffixe: "€", min: 0, step: 0.01, afficherSi: () => lireProfil("assurance.souscritMRC") === true, aide: "Le simulateur peut seulement afficher une référence 2025, car le guide ne donne pas le taux 2026." }),

            q("predation.zoneRisque", "Votre troupeau ovin/caprin pâture-t-il dans une commune classée en cercle de prédation ?", "select", { options: OUI_NON_INCONNU }),

            q("programmesSectoriels.concerne", "Votre activité relève-t-elle d'un programme sectoriel que vous souhaitez examiner ?", "yesno", { refreshOnChange: true }),
            q("programmesSectoriels.secteur", "Secteur concerné", "select", { afficherSi: programmeSectorielConcerne, refreshOnChange: true, options: [
                { valeur: "", texte: "Sélectionner" },
                { valeur: "vin", texte: "Vin" },
                { valeur: "apiculture", texte: "Apiculture" },
                { valeur: "fruits_legumes", texte: "Fruits et légumes" },
                { valeur: "huile_olive", texte: "Olives et huile d'olive" },
                { valeur: "proteines", texte: "Protéines végétales" },
                { valeur: "horticulture", texte: "Horticulture" },
                { valeur: "veau_label", texte: "Veau Label rouge" },
                { valeur: "lapin", texte: "Lapin" },
                { valeur: "riz", texte: "Riz" }
            ] }),
            q("programmesSectoriels.membreOPAOP", "Êtes-vous membre d'une OP/AOP porteuse d'un programme opérationnel ?", "yesno", { afficherSi: () => programmeSectorielConcerne() && programmeSectorielOPAOP() }),

            q("regional.souhaiteExaminer", "Souhaitez-vous examiner une aide régionale du Feader ?", "yesno", { refreshOnChange: true }),
            q("regional.type", "Type d'aide régionale recherchée", "select", { afficherSi: souhaiteRegional, options: [
                { valeur: "", texte: "Sélectionner" },
                { valeur: "investissement", texte: "Investissement" },
                { valeur: "installation", texte: "Installation / dotation" },
                { valeur: "maec_forfaitaire", texte: "MAEC forfaitaire" },
                { valeur: "api", texte: "MAEC API – potentiel pollinisateur des abeilles" },
                { valeur: "prm", texte: "MAEC PRM – races menacées" },
                { valeur: "gardiennage", texte: "Gardiennage hors prédation" },
                { valeur: "betteraves", texte: "Gestion des risques betteraves" },
                { valeur: "leader", texte: "LEADER" },
                { valeur: "cooperation", texte: "Coopération" },
                { valeur: "formation", texte: "Formation / échange de connaissances" },
                { valeur: "autre", texte: "Autre aide régionale" }
            ] })
        ]
    }
];

/* =========================================================
   RENDU
========================================================= */

function convertirValeur(valeur, type) {
    if (valeur === "") return null;
    if (valeur === "true") return true;
    if (valeur === "false") return false;
    if (type === "number") {
        const n = Number(valeur);
        return Number.isFinite(n) ? n : null;
    }
    return valeur;
}

function creerChampQuestion(question) {
    const valeur = lireProfil(question.chemin);
    const wrapper = document.createElement("div");
    wrapper.className = "question-item";

    const label = document.createElement("label");
    label.className = "question-label";
    label.textContent = question.label;
    wrapper.appendChild(label);

    if (question.type === "yesno") {
        const groupe = document.createElement("div");
        groupe.className = "yesno-group";
        [
            { texte: "Oui", valeur: true },
            { texte: "Non", valeur: false }
        ].forEach(option => {
            const bouton = document.createElement("button");
            bouton.type = "button";
            bouton.className = "answer-button" + (valeur === option.valeur ? " selected" : "");
            bouton.textContent = option.texte;
            bouton.addEventListener("click", () => {
                modifierProfil(question.chemin, option.valeur);
                sauvegarderProfilLocalement();
                afficherEtape();
            });
            groupe.appendChild(bouton);
        });
        wrapper.appendChild(groupe);
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
        });
        wrapper.appendChild(select);
    } else {
        const ligne = document.createElement("div");
        ligne.className = "input-with-suffix";
        const input = document.createElement("input");
        input.type = question.type;
        input.value = valeur ?? "";
        if (question.placeholder) input.placeholder = question.placeholder;
        if (question.min !== undefined) input.min = question.min;
        if (question.max !== undefined) input.max = question.max;
        if (question.step !== undefined) input.step = question.step;
        input.addEventListener("change", event => {
            modifierProfil(question.chemin, convertirValeur(event.target.value, question.type));
            sauvegarderProfilLocalement();
            if (question.refreshOnChange) afficherEtape();
        });
        ligne.appendChild(input);
        if (question.suffixe) {
            const suffixe = document.createElement("span");
            suffixe.className = "input-suffix";
            suffixe.textContent = question.suffixe;
            ligne.appendChild(suffixe);
        }
        wrapper.appendChild(ligne);
    }

    if (question.aide) {
        const aide = document.createElement("p");
        aide.className = "question-help";
        aide.textContent = question.aide;
        wrapper.appendChild(aide);
    }

    return wrapper;
}

/* =========================================================
   NAVIGATION LATÉRALE — STYLE TELEPAC MODERNISÉ
========================================================= */

function afficherNavigationLaterale() {
    const navigation = document.getElementById("sidebar-steps");
    if (!navigation) return;

    navigation.innerHTML = "";

    ETAPES_QUESTIONNAIRE.forEach((etape, index) => {
        const bouton = document.createElement("button");
        bouton.type = "button";
        bouton.className = "sidebar-step";

        if (!affichageResultats && index === etapeQuestionnaire) {
            bouton.classList.add("active");
        }

        if (affichageResultats || index < etapeQuestionnaire) {
            bouton.classList.add("completed");
        }

        const indicateur = document.createElement("span");
        indicateur.className = "step-indicator";
        indicateur.textContent = (affichageResultats || index < etapeQuestionnaire) ? "✓" : String(index + 1);

        const texte = document.createElement("span");
        texte.textContent = etape.titre;

        bouton.appendChild(indicateur);
        bouton.appendChild(texte);

        bouton.addEventListener("click", () => {
            affichageResultats = false;
            etapeQuestionnaire = index;

            const questionnaire = document.getElementById("questionnaire-card");
            const resultats = document.getElementById("results");
            if (questionnaire) questionnaire.style.display = "block";
            if (resultats) resultats.style.display = "none";

            afficherEtape();
        });

        navigation.appendChild(bouton);
    });

    const resultat = document.createElement("button");
    resultat.type = "button";
    resultat.className = "sidebar-step";

    if (affichageResultats) resultat.classList.add("active");

    const indicateurResultat = document.createElement("span");
    indicateurResultat.className = "step-indicator";
    indicateurResultat.textContent = affichageResultats ? "✓" : String(ETAPES_QUESTIONNAIRE.length + 1);

    const texteResultat = document.createElement("span");
    texteResultat.textContent = "Résultats";

    resultat.appendChild(indicateurResultat);
    resultat.appendChild(texteResultat);

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

    const pourcentage = ((etapeQuestionnaire + 1) / ETAPES_QUESTIONNAIRE.length) * 100;
    document.getElementById("progress-bar").style.width = `${pourcentage}%`;
    document.getElementById("step-counter").textContent = `Étape ${etapeQuestionnaire + 1} sur ${ETAPES_QUESTIONNAIRE.length}`;
    document.getElementById("previous-button").style.display = etapeQuestionnaire === 0 ? "none" : "inline-flex";
    document.getElementById("next-button").textContent = etapeQuestionnaire === ETAPES_QUESTIONNAIRE.length - 1 ? "Analyser mon exploitation" : "Continuer";
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

function libelleTypeCalcul(type) {
    const libelles = {
        campagne_2026: "Paramètre 2026 / règle du guide 2026",
        profil_exploitation: "Donnée réelle de l'exploitation",
        reference_2024: "Référence 2024",
        reference_2025: "Référence 2025",
        partiel: "Calcul partiel / à confirmer",
        non_calculable: "Non calculable avec les données disponibles"
    };
    return libelles[type] || type;
}

function creerCarteResultat(resultat, calcul) {
    const carte = document.createElement("article");
    carte.className = `result-card ${resultat.statut === STATUT_AIDE.A_EXAMINER ? "success" : "warning"}`;

    const montant = calcul && calcul.montant !== null
        ? `<div class="result-amount">${calcul.montantFormate}</div><div class="result-reference">${libelleTypeCalcul(calcul.type)}</div>`
        : `<div class="result-reference">${calcul ? libelleTypeCalcul(calcul.type) : ""}</div>`;

    const raisons = resultat.raisons.length
        ? `<div class="result-details"><strong>Pourquoi ?</strong>${resultat.raisons.map(r => `<p>✓ ${r}</p>`).join("")}</div>`
        : "";

    const manquants = resultat.informationsManquantes.length
        ? `<div class="result-details"><strong>À compléter</strong>${resultat.informationsManquantes.map(r => `<p>• ${r}</p>`).join("")}</div>`
        : "";

    const avertissements = [
        ...(resultat.verifications || []),
        ...((calcul && calcul.avertissements) || [])
    ];
    const avertissementsHtml = avertissements.length
        ? `<div class="result-warnings">${[...new Set(avertissements)].map(a => `<p>${a}</p>`).join("")}</div>`
        : "";

    carte.innerHTML = `
        <div class="result-status">${resultat.statut === STATUT_AIDE.A_EXAMINER ? "À EXAMINER" : "INFORMATIONS À COMPLÉTER"}</div>
        <h3>${resultat.nom}</h3>
        ${montant}
        ${raisons}
        ${manquants}
        ${avertissementsHtml}
        <div class="result-source">Source : ${resultat.source}</div>
    `;
    return carte;
}

function afficherSynthese(zone) {
    const synthese = calculerSyntheseFinanciere();
    const valeurs = [
        ["Données exploitation", synthese.profilExploitation],
        ["Calculs / paramètres 2026", synthese.campagne2026],
        ["Références 2024", synthese.reference2024],
        ["Références 2025", synthese.reference2025],
        ["Calculs partiels", synthese.partiel]
    ].filter(([, montant]) => montant > 0);

    if (!valeurs.length) return;
    const grille = document.createElement("div");
    grille.className = "summary-grid";
    valeurs.forEach(([libelle, montant]) => {
        const bloc = document.createElement("div");
        bloc.className = "summary-card";
        bloc.innerHTML = `<span>${libelle}</span><strong>${formaterMontant(montant)}</strong>`;
        grille.appendChild(bloc);
    });
    zone.appendChild(grille);

    const note = document.createElement("p");
    note.className = "summary-note";
    note.textContent = "Les totaux sont séparés par nature : ils ne doivent pas être additionnés comme s'il s'agissait tous de montants définitifs 2026.";
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
    header.innerHTML = `
        <span class="context-label">ORIENTATION PAC 2026</span>
        <h2>${aExaminer.length} aide${aExaminer.length > 1 ? "s" : ""} à examiner</h2>
        <p>Orientation fondée sur les informations saisies et le guide PAC utilisé. Elle ne constitue pas une décision administrative d'éligibilité.</p>
    `;
    zone.appendChild(header);

    if (profilExploitation.general.territoire === "Outre-mer") {
        const alerte = document.createElement("div");
        alerte.className = "notice warning-notice";
        alerte.textContent = "Les modalités spécifiques Outre-mer ne sont pas détaillées dans cette version du moteur. Les résultats nationaux affichés doivent être considérés comme incomplets.";
        zone.appendChild(alerte);
    }

    afficherSynthese(zone);

    aExaminer.forEach(resultat => {
        const calcul = calculs.find(c => c.id === resultat.id);
        zone.appendChild(creerCarteResultat(resultat, calcul));
    });

    if (incompletes.length) {
        const titre = document.createElement("h3");
        titre.className = "results-section-title";
        titre.textContent = "Informations utiles à compléter";
        zone.appendChild(titre);
        incompletes.forEach(resultat => {
            const calcul = calculs.find(c => c.id === resultat.id);
            zone.appendChild(creerCarteResultat(resultat, calcul));
        });
    }

    if (nonRetenues.length) {
        const details = document.createElement("details");
        details.className = "not-retained";
        const summary = document.createElement("summary");
        summary.textContent = `${nonRetenues.length} aide(s) non retenue(s) avec les informations actuelles`;
        details.appendChild(summary);
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
    actions.innerHTML = `
        <button type="button" class="button button-secondary" id="edit-results-button">Modifier mes réponses</button>
        <button type="button" class="button button-secondary" id="reset-results-button">Recommencer à zéro</button>
    `;
    zone.appendChild(actions);

    document.getElementById("edit-results-button").addEventListener("click", recommencerQuestionnaire);
    document.getElementById("reset-results-button").addEventListener("click", () => {
        reinitialiserProfil();
        etapeQuestionnaire = 0;
        zone.style.display = "none";
        questionnaire.style.display = "block";
        afficherEtape();
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function recommencerQuestionnaire() {
    affichageResultats = false;
    document.getElementById("results").style.display = "none";
    document.getElementById("questionnaire-card").style.display = "block";
    etapeQuestionnaire = 0;
    afficherEtape();
}

function initialiserQuestionnaire() {
    chargerProfilLocal();
    affichageResultats = false;
    afficherEtape();

    const boutonSuivant = document.getElementById("next-button");
    const boutonPrecedent = document.getElementById("previous-button");
    const boutonReset = document.getElementById("reset-button");

    if (boutonSuivant) {
        boutonSuivant.addEventListener("click", etapeSuivante);
    }

    if (boutonPrecedent) {
        boutonPrecedent.addEventListener("click", etapePrecedente);
    }

    if (boutonReset) {
        boutonReset.addEventListener("click", () => {
            if (!confirm("Effacer toutes les réponses enregistrées dans ce navigateur ?")) return;
            reinitialiserProfil();
            etapeQuestionnaire = 0;
            affichageResultats = false;
            document.getElementById("results").style.display = "none";
            document.getElementById("questionnaire-card").style.display = "block";
            afficherEtape();
        });
    }
}
