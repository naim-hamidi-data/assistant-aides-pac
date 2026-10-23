/* =========================================================
   ASSISTANT PAC — CHATBOT FR / EN / ES

   - Fonctionne sur GitHub Pages sans clé API.
   - Utilise le référentiel et le profil déjà chargés.
   - Peut appeler un backend sécurisé optionnel.
   - Ne jamais placer de clé secrète dans le navigateur.
========================================================= */

const CHATBOT_STORAGE_LANGUAGE = "assistant_pac_chat_language";
const CHATBOT_STORAGE_HISTORY = "assistant_pac_chat_history";

let chatbotLanguage = "fr";
let chatbotHistory = [];
let chatbotBusy = false;

function getChatbotLanguage() {
    return chatbotLanguage;
}

function normaliserTexteChatbot(texte) {
    return String(texte || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9áéíóúñüàâäçèêëîïôöùûüœæ\s-]/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function chargerEtatChatbot() {
    const savedLanguage = localStorage.getItem(CHATBOT_STORAGE_LANGUAGE);
    if (CHATBOT_LANGUAGES.includes(savedLanguage)) chatbotLanguage = savedLanguage;

    try {
        const history = JSON.parse(localStorage.getItem(CHATBOT_STORAGE_HISTORY) || "[]");
        if (Array.isArray(history)) chatbotHistory = history.slice(-40);
    } catch (error) {
        chatbotHistory = [];
    }
}

function sauvegarderHistoriqueChatbot() {
    localStorage.setItem(CHATBOT_STORAGE_HISTORY, JSON.stringify(chatbotHistory.slice(-40)));
}

function setChatbotLanguage(lang) {
    if (!CHATBOT_LANGUAGES.includes(lang)) return;
    chatbotLanguage = lang;
    localStorage.setItem(CHATBOT_STORAGE_LANGUAGE, lang);
    mettreAJourTextesChatbot();
    afficherHistoriqueChatbot();
}

function formaterVoieEcoregimeChatbot(voie) {
    if (!voie) return null;
    const map = {
        pratiques: chatbotT("bestWayPractices"),
        certification: chatbotT("bestWayCertification"),
        biodiversite: chatbotT("bestWayBiodiversity")
    };
    return map[voie] || voie;
}

function formaterNiveauEcoregimeChatbot(niveau) {
    const map = {
        base: chatbotT("levelBase"),
        superieur: chatbotT("levelHigher"),
        bio: chatbotT("levelBio")
    };
    return map[niveau] || niveau || "";
}

function obtenirIndicateursChatbot() {
    try {
        if (typeof calculerIndicateursPAC === "function") return calculerIndicateursPAC();
    } catch (error) {
        console.warn("Chatbot: indicateurs indisponibles", error);
    }
    return null;
}

function obtenirOrientationsChatbot() {
    try {
        if (typeof analyserToutesLesAides === "function") return analyserToutesLesAides();
    } catch (error) {
        console.warn("Chatbot: orientations indisponibles", error);
    }
    return [];
}

function obtenirCalculsChatbot() {
    try {
        if (typeof calculerToutesLesAides === "function") return calculerToutesLesAides();
    } catch (error) {
        console.warn("Chatbot: calculs indisponibles", error);
    }
    return [];
}

function detecterIntentionChatbot(message) {
    const q = normaliserTexteChatbot(message);
    const has = (...terms) => terms.some(term => q.includes(normaliserTexteChatbot(term)));

    if (has("aide", "aides", "support", "scheme", "schemes", "ayuda", "ayudas", "diagnostic", "resultat", "resultats", "results", "resultado", "resultados", "eligible", "eligibility", "elegible") &&
        has("mon", "mes", "my", "mi", "mis", "quelles", "which", "cuales", "combien", "how much", "cuanto")) return "diagnostic";

    if (has("ecoregime", "eco regime", "eco-scheme", "ecoscheme", "ecorregimen", "ecorregímen", "ecorregimenes", "points", "diversification", "biodiversite", "biodiversity", "biodiversidad")) return "ecoregime";
    if (has("ugb", "livestock unit", "livestock units", "lu ", "ugm", "unidad ganadera")) return "ugb";
    if (has("agriculteur actif", "active farmer", "agricultor activo")) return "actif";
    if (has("dpb", "droit paiement", "droits paiement", "payment entitlement", "payment entitlements", "derechos de pago", "aide de base", "basic income")) return "dpb";
    if (has("redistributive", "redistributif", "redistributiva")) return "redistributive";
    if (has("jeune agriculteur", "young farmer", "joven agricultor", "acja")) return "young";
    if (has("ichn", "anc", "handicap naturel", "natural constraint", "zona desfavorecida")) return "ichn";
    if (has("cab", "conversion bio", "conversion biologique", "organic conversion", "conversion ecologica", "conversion ecológica")) return "bio";
    if (has("maec", "agri-environment", "agri environment", "agroambiental", "climate measure")) return "maec";
    if (has("bovin", "bovine", "cattle", "cow", "sheep", "ovin", "goat", "caprin", "ganado", "oveja", "cabra", "veau", "calf", "ternero")) return "animal";
    if (has("legumineuse", "legume", "protein crop", "crop support", "aide vegetale", "vegetal", "trigo duro", "ble dur", "riz", "rice", "arroz", "chanvre", "hemp", "canamo", "cáñamo", "maraichage", "horticulture")) return "plant";
    if (has("source", "referentiel", "reference", "guide", "fuente")) return "source";
    if (has("aide", "help", "ayuda", "que peux tu", "what can you", "que puedes")) return "help";
    return "unknown";
}

function reponseDiagnosticChatbot() {
    const orientations = obtenirOrientationsChatbot();
    const calculs = obtenirCalculsChatbot();
    const statutExaminer = typeof STATUT_AIDE !== "undefined" ? STATUT_AIDE.A_EXAMINER : "A_EXAMINER";
    const aExaminer = orientations.filter(item => item.statut === statutExaminer);

    let texte = aExaminer.length
        ? chatbotT("diagnosticIntro", {
            count: aExaminer.length,
            list: aExaminer.slice(0, 8).map(item => item.nom).join(", ")
        })
        : chatbotT("diagnosticNone");

    const calculables = calculs
        .filter(item => typeof item.montant === "number" && Number.isFinite(item.montant) && item.montant > 0)
        .slice(0, 8);

    if (calculables.length) {
        const liste = calculables.map(item => {
            const montant = item.montantFormate || (typeof formaterMontant === "function" ? formaterMontant(item.montant) : `${Math.round(item.montant * 100) / 100} €`);
            return `${item.nom || item.id}: ${montant}`;
        }).join(" · ");
        texte += `\n\n${chatbotT("amountIntro", { list: liste })}`;
    } else {
        texte += `\n\n${chatbotT("amountNone")}`;
    }

    return texte;
}

function genererReponseLocaleChatbot(message) {
    const intention = detecterIntentionChatbot(message);
    const indicateurs = obtenirIndicateursChatbot();

    if (intention === "ecoregime") {
        let texte = chatbotT("ecoGeneric");
        const eco = indicateurs?.ecoregime;
        if (eco?.meilleureVoie) {
            const result = `${formaterVoieEcoregimeChatbot(eco.meilleureVoie.voie)} — ${formaterNiveauEcoregimeChatbot(eco.meilleureVoie.niveau)}`;
            texte += `\n\n${chatbotT("ecoCurrent", { result })}`;
            if (eco.scoreDiversification && typeof eco.scoreDiversification.points === "number") {
                const label = chatbotLanguage === "en" ? "Diversification score" : chatbotLanguage === "es" ? "Puntuación de diversificación" : "Score de diversification";
                texte += ` ${label}: ${eco.scoreDiversification.points}.`;
            }
        } else {
            texte += `\n\n${chatbotT("ecoNoResult")}`;
        }
        return texte;
    }

    if (intention === "ugb") {
        const value = indicateurs?.bovins?.total;
        return typeof value === "number"
            ? chatbotT("ugbCurrent", { value: Math.round(value * 10) / 10 })
            : chatbotT("noData");
    }

    if (intention === "actif") {
        const statut = indicateurs?.agriculteurActif?.statut;
        if (statut === true) return chatbotT("activeTrue");
        if (statut === false) return chatbotT("activeFalse");
        return chatbotT("activeUnknown");
    }

    if (intention === "diagnostic") return reponseDiagnosticChatbot();
    if (["dpb", "redistributive", "young", "ichn", "bio", "maec", "animal", "plant", "help", "source"].includes(intention)) return chatbotT(intention);
    return `${chatbotT("unknown")}\n\n${chatbotT("help")}`;
}

async function appelerBackendChatbot(message) {
    const config = window.CHATBOT_CONFIG || {};
    if (!config.apiEndpoint) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs || 15000);

    try {
        const payload = {
            message,
            language: chatbotLanguage,
            history: chatbotHistory.slice(-12),
            profile: typeof profilExploitation !== "undefined" ? profilExploitation : null,
            indicators: obtenirIndicateursChatbot()
        };

        const response = await fetch(config.apiEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data.answer || data.message || data.response || null;
    } finally {
        clearTimeout(timer);
    }
}

function creerMessageChatbot(role, texte) {
    const message = document.createElement("div");
    message.className = `chat-message ${role}`;
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    bubble.textContent = texte;
    message.appendChild(bubble);
    return message;
}

function afficherHistoriqueChatbot() {
    const zone = document.getElementById("chatbot-messages");
    if (!zone) return;
    zone.innerHTML = "";

    if (!chatbotHistory.length) {
        zone.appendChild(creerMessageChatbot("assistant", chatbotT("welcome")));
    } else {
        chatbotHistory.forEach(item => zone.appendChild(creerMessageChatbot(item.role, item.text)));
    }
    zone.scrollTop = zone.scrollHeight;
}

function ajouterMessageHistorique(role, text) {
    chatbotHistory.push({ role, text, language: chatbotLanguage, at: new Date().toISOString() });
    chatbotHistory = chatbotHistory.slice(-40);
    sauvegarderHistoriqueChatbot();
    afficherHistoriqueChatbot();
}

function mettreAJourTextesChatbot() {
    const panel = document.getElementById("chatbot-panel");
    if (panel) panel.setAttribute("lang", chatbotLanguage);

    const title = document.getElementById("chatbot-title");
    const subtitle = document.getElementById("chatbot-subtitle");
    const input = document.getElementById("chatbot-input");
    const send = document.getElementById("chatbot-send");
    const clear = document.getElementById("chatbot-clear");
    const close = document.getElementById("chatbot-close");
    const launcher = document.getElementById("chatbot-launcher");
    const note = document.getElementById("chatbot-mode-note");

    if (title) title.textContent = chatbotT("title");
    if (subtitle) subtitle.textContent = chatbotT("subtitle");
    if (input) input.placeholder = chatbotT("placeholder");
    if (send) send.textContent = chatbotT("send");
    if (clear) clear.title = chatbotT("clear");
    if (close) close.title = chatbotT("close");
    if (launcher) launcher.setAttribute("aria-label", chatbotT("open"));
    if (note) note.textContent = chatbotT("localMode");

    document.querySelectorAll("[data-chat-lang]").forEach(button => {
        button.classList.toggle("active", button.dataset.chatLang === chatbotLanguage);
        button.setAttribute("aria-pressed", button.dataset.chatLang === chatbotLanguage ? "true" : "false");
    });
}

function ouvrirChatbot() {
    const panel = document.getElementById("chatbot-panel");
    const launcher = document.getElementById("chatbot-launcher");
    if (!panel) return;
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    if (launcher) launcher.classList.add("hidden");
    setTimeout(() => document.getElementById("chatbot-input")?.focus(), 50);
}

function fermerChatbot() {
    const panel = document.getElementById("chatbot-panel");
    const launcher = document.getElementById("chatbot-launcher");
    if (!panel) return;
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    if (launcher) launcher.classList.remove("hidden");
}

function afficherEtatSaisieChatbot(show) {
    const indicator = document.getElementById("chatbot-typing");
    if (!indicator) return;
    indicator.style.display = show ? "block" : "none";
    indicator.textContent = chatbotT("typing");
}

async function envoyerMessageChatbot() {
    if (chatbotBusy) return;
    const input = document.getElementById("chatbot-input");
    const message = input?.value.trim();
    if (!message) return;

    input.value = "";
    ajouterMessageHistorique("user", message);
    chatbotBusy = true;
    afficherEtatSaisieChatbot(true);

    let reponse = null;
    try {
        reponse = await appelerBackendChatbot(message);
    } catch (error) {
        console.warn("Chatbot backend indisponible", error);
        ajouterMessageHistorique("assistant", chatbotT("backendError"));
    }

    if (!reponse) reponse = genererReponseLocaleChatbot(message);
    ajouterMessageHistorique("assistant", reponse);

    afficherEtatSaisieChatbot(false);
    chatbotBusy = false;
}

function effacerConversationChatbot() {
    chatbotHistory = [];
    localStorage.removeItem(CHATBOT_STORAGE_HISTORY);
    afficherHistoriqueChatbot();
}

function initialiserChatbot() {
    chargerEtatChatbot();
    mettreAJourTextesChatbot();
    afficherHistoriqueChatbot();

    document.getElementById("chatbot-launcher")?.addEventListener("click", ouvrirChatbot);
    document.getElementById("chatbot-close")?.addEventListener("click", fermerChatbot);
    document.getElementById("chatbot-send")?.addEventListener("click", envoyerMessageChatbot);
    document.getElementById("chatbot-clear")?.addEventListener("click", effacerConversationChatbot);

    document.querySelectorAll("[data-chat-lang]").forEach(button => {
        button.addEventListener("click", () => setChatbotLanguage(button.dataset.chatLang));
    });

    document.getElementById("chatbot-input")?.addEventListener("keydown", event => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            envoyerMessageChatbot();
        }
    });
}
