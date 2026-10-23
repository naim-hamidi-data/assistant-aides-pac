/* =========================================================
   CONFIGURATION DU CHATBOT

   Par défaut, le chatbot fonctionne entièrement dans le
   navigateur avec le référentiel PAC intégré et les données
   du profil utilisateur.

   Pour connecter plus tard un backend IA, renseigner
   apiEndpoint avec une URL HTTPS qui accepte un POST JSON.

   IMPORTANT : ne jamais placer une clé API OpenAI ou autre
   secret directement dans ce fichier ou dans GitHub Pages.
========================================================= */

window.CHATBOT_CONFIG = {
    apiEndpoint: "",
    timeoutMs: 15000
};
