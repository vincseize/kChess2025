/**
 * core/app-log-manager.js
 * Gestionnaire centralisé des logs pour CharlyChess.
 * Système de priorité : LOCAL_DEBUG (JS) > MODULE_CONFIG (JSON) > GLOBAL_DEBUG (JSON)
 */
class AppLogManager {
    /**
     * Calcule si le log est autorisé.
     * @param {string} moduleKey - Clé du module (ex: 'chess_engine', 'debug')
     * @param {boolean} localOverride - Variable statique du fichier (ex: ChessTimerManager.LOCAL_DEBUG)
     * @returns {boolean}
     */
    static shouldLog(moduleKey, localOverride = false) {
        // 1. Priorité absolue au local (pour le développement ciblé)
        if (localOverride === true) return true;

        // 2. Récupération de la config globale injectée par PHP (header.php)
        const config = window.appConfig;
        
        if (config) {
            // Vérifie la clé spécifique (ex: appConfig.chess_engine.console_log)
            // Sinon se replie sur le debug global (ex: appConfig.debug.console_log)
            return config[moduleKey]?.console_log 
                ?? config.debug?.console_log 
                ?? false;
        }

        return false; // Silence par défaut si aucune config n'est trouvée
    }

    /**
     * Version simplifiée pour obtenir un booléen canLog dès le constructeur
     */
    static getPermission(moduleKey, localOverride = false) {
        return this.shouldLog(moduleKey, localOverride);
    }

    /**
     * Utilitaire pour logger avec un style cohérent (Optionnel)
     */
    static log(canLog, icon, prefix, message, data = null) {
        if (!canLog) return;
        
        const text = `${icon} [${prefix}] ${message}`;
        if (data) {
            console.log(text, data);
        } else {
            console.log(text);
        }
    }

    /**
     * Utilitaire pour créer un groupe de logs (très utile pour les initialisations complexes)
     */
    static group(canLog, label, callback) {
        if (!canLog) {
            callback();
            return;
        }
        console.group(`📦 ${label}`);
        callback();
        console.groupEnd();
    }
}

// Rendre disponible globalement pour tous les modules JS
window.AppLogManager = AppLogManager;