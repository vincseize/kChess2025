/**
 * core/app-log-manager.js
 * Gestionnaire centralisé des logs pour K-Chess.
 */
class AppLogManager {
    /**
     * Détermine si un module a l'autorisation de loguer.
     * @param {string} moduleKey - Clé du module dans appConfig (ex: 'timer', 'engine')
     * @param {boolean} localOverride - Forçage local défini dans la classe du module
     */
    static shouldLog(moduleKey, localOverride = false) {
        // Priorité 1 : Forçage local dans le code (mode développeur actif)
        if (localOverride === true) return true;

        // Priorité 2 : Configuration globale (souvent injectée via PHP dans header.php)
        const config = window.appConfig;
        if (config) {
            return config[moduleKey]?.console_log 
                ?? config.debug?.console_log 
                ?? false;
        }

        return false; // Silence par défaut
    }

    /**
     * Affiche un log formaté si autorisé
     */
    static log(canLog, icon, prefix, message, data = null) {
        if (!canLog) return;
        
        const timestamp = new Date().toLocaleTimeString('fr-FR', { hour12: false });
        const text = `${icon} [${timestamp}] [${prefix}] ${message}`;
        
        if (data) {
            console.log(text, data);
        } else {
            console.log(text);
        }
    }
}

// Rendre disponible globalement
window.AppLogManager = AppLogManager;