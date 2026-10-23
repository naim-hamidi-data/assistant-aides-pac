/* =========================================================
   ASSISTANT PAC — INTERNATIONALISATION DU SIMULATEUR
   FR / EN / ES
========================================================= */

const SIMULATOR_LANGUAGES = ["fr", "en", "es"];
const SIMULATOR_STORAGE_LANGUAGE = "assistant_pac_language";
let simulatorLanguage = "fr";

function getSimulatorLanguage() {
    return simulatorLanguage;
}

function simulatorLocale(lang = simulatorLanguage) {
    return lang === "en" ? "en-GB" : lang === "es" ? "es-ES" : "fr-FR";
}

function chargerLangueSimulator() {
    const saved = localStorage.getItem(SIMULATOR_STORAGE_LANGUAGE);
    const chatSaved = localStorage.getItem("assistant_pac_chat_language");
    if (SIMULATOR_LANGUAGES.includes(saved)) simulatorLanguage = saved;
    else if (SIMULATOR_LANGUAGES.includes(chatSaved)) simulatorLanguage = chatSaved;
    else simulatorLanguage = "fr";
}

function simDictionnaire(lang = simulatorLanguage) {
    if (lang === "en") return typeof SIMULATOR_EN !== "undefined" ? SIMULATOR_EN : {};
    if (lang === "es") return typeof SIMULATOR_ES !== "undefined" ? SIMULATOR_ES : {};
    return {};
}

function simMessages(lang = simulatorLanguage) {
    if (lang === "en") return typeof SIMULATOR_EN_MESSAGES !== "undefined" ? SIMULATOR_EN_MESSAGES : {};
    if (lang === "es") return typeof SIMULATOR_ES_MESSAGES !== "undefined" ? SIMULATOR_ES_MESSAGES : {};
    return {};
}

function simL(fr, en, es) {
    return simulatorLanguage === "en" ? en : simulatorLanguage === "es" ? es : fr;
}

function simT(text) {
    if (text === null || text === undefined) return "";
    const raw = String(text);
    if (simulatorLanguage === "fr") return raw;
    return simDictionnaire()[raw] || raw;
}

function simVoieName(voie) {
    const maps = {
        fr: { pratiques: "pratiques", certification: "certification", biodiversite: "biodiversité" },
        en: { pratiques: "practices", certification: "certification", biodiversite: "biodiversity" },
        es: { pratiques: "prácticas", certification: "certificación", biodiversite: "biodiversidad" }
    };
    return maps[simulatorLanguage]?.[voie] || voie || "";
}

function simNiveau(niveau) {
    const maps = {
        fr: { bio: "niveau spécifique AB", superieur: "niveau supérieur", base: "niveau de base", aucun: "non atteint" },
        en: { bio: "specific organic level", superieur: "higher level", base: "basic level", aucun: "not reached" },
        es: { bio: "nivel específico ecológico", superieur: "nivel superior", base: "nivel básico", aucun: "no alcanzado" }
    };
    return maps[simulatorLanguage]?.[niveau] || maps[simulatorLanguage]?.aucun || niveau || "";
}

function simSectorName(code) {
    const maps = {
        fr: {
            vin: "vin", apiculture: "apiculture", fruits_legumes: "fruits et légumes", huile_olive: "huile d'olive",
            proteines: "protéines végétales", horticulture: "horticulture", veau_label: "veau Label rouge", lapin: "lapin", riz: "riz"
        },
        en: {
            vin: "wine", apiculture: "beekeeping", fruits_legumes: "fruit and vegetables", huile_olive: "olive oil",
            proteines: "plant proteins", horticulture: "horticulture", veau_label: "Label Rouge veal", lapin: "rabbit", riz: "rice"
        },
        es: {
            vin: "vino", apiculture: "apicultura", fruits_legumes: "frutas y hortalizas", huile_olive: "aceite de oliva",
            proteines: "proteínas vegetales", horticulture: "horticultura", veau_label: "ternero Label Rouge", lapin: "conejo", riz: "arroz"
        }
    };
    return maps[simulatorLanguage]?.[code] || code || "";
}

function simSource(source) {
    if (!source || simulatorLanguage === "fr") return source || "";
    const raw = String(source);
    const annex = raw.match(/^Annexe\s+(\d+)(?:\s+[–-]\s+(.+))?$/i);
    if (annex) {
        const prefix = simulatorLanguage === "en" ? "Annex" : "Anexo";
        let title = annex[2] || "";
        if (title === "Régime des DPB") title = simulatorLanguage === "en" ? "Payment entitlement scheme" : "Régimen de derechos de pago";
        if (title === "Écorégime") title = simulatorLanguage === "en" ? "Eco-scheme" : "Ecorregímenes";
        return `${prefix} ${annex[1]}${title ? ` – ${title}` : ""}`;
    }
    const fiche = raw.match(/^Fiche\s+(.+)$/i);
    if (fiche) {
        const prefix = simulatorLanguage === "en" ? "Fact sheet" : "Ficha";
        const names = {
            "aide redistributive": simulatorLanguage === "en" ? "redistributive income support" : "ayuda redistributiva",
            "ACJA": simulatorLanguage === "en" ? "young-farmer income support" : "ayuda a jóvenes agricultores",
            "gestion des risques": simulatorLanguage === "en" ? "risk management" : "gestión de riesgos",
            "prédation": simulatorLanguage === "en" ? "predation protection" : "protección frente a la depredación",
            "programmes sectoriels": simulatorLanguage === "en" ? "sectoral programmes" : "programas sectoriales",
            "aides des Régions": simulatorLanguage === "en" ? "regional support" : "ayudas regionales"
        };
        return `${prefix}: ${names[fiche[1]] || fiche[1]}`;
    }
    return raw;
}

function simAidName(id, fallback = "") {
    let name = fallback;
    try {
        if (typeof obtenirAide === "function") {
            const aide = obtenirAide(id);
            if (aide?.nom) name = aide.nom;
        }
    } catch (error) {}
    return simT(name || id);
}

function simMessage(text) {
    if (text === null || text === undefined) return "";
    const raw = String(text);
    if (simulatorLanguage === "fr") return raw;

    const exact = simMessages()[raw] || simDictionnaire()[raw];
    if (exact) return exact;

    let match;
    match = raw.match(/^Voie (pratiques|certification|biodiversité) : niveau (base|supérieur|spécifique AB)\.?$/i);
    if (match) {
        const voieCode = match[1].toLowerCase().startsWith("prat") ? "pratiques" : match[1].toLowerCase().startsWith("cert") ? "certification" : "biodiversite";
        const niveauCode = match[2].toLowerCase().includes("spécifique") ? "bio" : match[2].toLowerCase().includes("sup") ? "superieur" : "base";
        return simulatorLanguage === "en"
            ? `${simVoieName(voieCode)} route: ${simNiveau(niveauCode)}.`
            : `Vía de ${simVoieName(voieCode)}: ${simNiveau(niveauCode)}.`;
    }

    match = raw.match(/^UGB disponibles calculées \/ renseignées : ([0-9.,]+)\.?$/i);
    if (match) return simulatorLanguage === "en" ? `Available LU calculated / entered: ${match[1]}.` : `UGM disponibles calculadas / indicadas: ${match[1]}.`;

    match = raw.match(/^Au moins 5 UGB disponibles \(([0-9.,]+) calculées \/ renseignées\)\.?$/i);
    if (match) return simulatorLanguage === "en" ? `At least 5 LU available (${match[1]} calculated / entered).` : `Al menos 5 UGM disponibles (${match[1]} calculadas / indicadas).`;

    match = raw.match(/^Secteur\(s\) détecté\(s\) : (.+)\.?$/i);
    if (match) {
        const sectors = match[1].split(/,\s*/).map(simSectorName).join(", ");
        return simulatorLanguage === "en" ? `Detected sector(s): ${sectors}.` : `Sector(es) detectado(s): ${sectors}.`;
    }

    match = raw.match(/^Part fixe théorique avant modulation : (.+)\.?$/i);
    if (match) return simulatorLanguage === "en" ? `Theoretical fixed component before modulation: ${match[1]}.` : `Parte fija teórica antes de la modulación: ${match[1]}.`;

    match = raw.match(/^Montant avant réduction éventuelle : (.+)\.?$/i);
    if (match) return simulatorLanguage === "en" ? `Amount before any reduction: ${match[1]}.` : `Importe antes de una posible reducción: ${match[1]}.`;

    match = raw.match(/^Score de diversification calculé : ([0-9.,]+) point\(s\), inférieur au niveau de base\.$/i);
    if (match) return simulatorLanguage === "en" ? `Calculated diversification score: ${match[1]} point(s), below the basic level.` : `Puntuación de diversificación calculada: ${match[1]} punto(s), por debajo del nivel básico.`;

    match = raw.match(/^([0-9.,]+) points?$/i);
    if (match) return simulatorLanguage === "en" ? `${match[1]} points` : `${match[1]} puntos`;

    match = raw.match(/^Cette variante concerne le territoire « (.+) »\.$/i);
    if (match) return simulatorLanguage === "en" ? `This variant applies to the “${match[1]}” territory.` : `Esta variante se aplica al territorio «${match[1]}».`;

    match = raw.match(/^([0-9.,]+) UGB bovines calculées\.$/i);
    if (match) return simulatorLanguage === "en" ? `${match[1]} cattle LU calculated.` : `${match[1]} UGM bovinas calculadas.`;

    match = raw.match(/^L'effectif total est inférieur au seuil de ([0-9.,]+) animaux\.$/i);
    if (match) return simulatorLanguage === "en" ? `The total number of animals is below the ${match[1]}-animal threshold.` : `El número total de animales es inferior al umbral de ${match[1]} animales.`;

    match = raw.match(/^([0-9.,]+) point\(s\)$/i);
    if (match) return simulatorLanguage === "en" ? `${match[1]} point(s)` : `${match[1]} punto(s)`;

    return raw;
}

function simStaticTitle() {
    return simulatorLanguage === "en" ? "CAP Assistant" : simulatorLanguage === "es" ? "Asistente PAC" : "Assistant PAC";
}

function appliquerTextesStatiquesSimulator() {
    document.documentElement.lang = simulatorLanguage;
    document.title = simStaticTitle();
    const logo = document.querySelector(".logo-block");
    if (logo) logo.textContent = simulatorLanguage === "en" ? "CAP" : "PAC";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = simL(
        "Assistant d'orientation et d'estimation des aides PAC à partir du profil de l'exploitation.",
        "CAP support guidance and estimation assistant based on the farm profile.",
        "Asistente de orientación y estimación de ayudas PAC a partir del perfil de la explotación."
    );

    document.querySelectorAll("[data-sim-text]").forEach(element => {
        const source = element.dataset.simText;
        element.textContent = simT(source);
    });

    document.querySelectorAll("[data-sim-placeholder]").forEach(element => {
        element.placeholder = simT(element.dataset.simPlaceholder);
    });

    document.querySelectorAll("[data-sim-title]").forEach(element => {
        const translated = simT(element.dataset.simTitle);
        element.title = translated;
        element.setAttribute("aria-label", translated);
    });

    document.querySelectorAll("[data-site-lang]").forEach(button => {
        const active = button.dataset.siteLang === simulatorLanguage;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
    });
}

function setSimulatorLanguage(lang, options = {}) {
    if (!SIMULATOR_LANGUAGES.includes(lang)) return;
    const rerender = options.rerender !== false;
    simulatorLanguage = lang;
    localStorage.setItem(SIMULATOR_STORAGE_LANGUAGE, lang);
    localStorage.setItem("assistant_pac_chat_language", lang);
    appliquerTextesStatiquesSimulator();

    if (rerender) {
        try {
            if (typeof affichageResultats !== "undefined" && affichageResultats && typeof afficherResultatsQuestionnaire === "function") {
                afficherResultatsQuestionnaire();
            } else if (typeof afficherEtape === "function" && typeof ETAPES_QUESTIONNAIRE !== "undefined") {
                afficherEtape();
            }
        } catch (error) {
            console.warn("Assistant PAC: impossible de rafraîchir l'interface après changement de langue", error);
        }
    }

    window.dispatchEvent(new CustomEvent("assistantpac:languagechange", { detail: { language: lang } }));
}

function initialiserLangueSimulator() {
    chargerLangueSimulator();
    appliquerTextesStatiquesSimulator();
    document.querySelectorAll("[data-site-lang]").forEach(button => {
        button.addEventListener("click", () => setSimulatorLanguage(button.dataset.siteLang));
    });
}
