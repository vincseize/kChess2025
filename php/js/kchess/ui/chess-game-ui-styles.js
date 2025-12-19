/**
 * ui/chess-game-ui-styles.js
 * Gère l'injection dynamique du CSS pour l'interface de CharlyChess
 */
class ChessStyleManager {
    static LOCAL_DEBUG = false; // Forcer le log localement si besoin
    static MODULE_KEY = 'debug'; // Utilise la clé 'debug' de ton JSON

    constructor(ui) {
        this.ui = ui;
        // On récupère l'autorisation de loguer une seule fois
        this.canLog = AppLogManager.shouldLog(ChessStyleManager.MODULE_KEY, ChessStyleManager.LOCAL_DEBUG);
        
        AppLogManager.log(this.canLog, '🎨', 'Styles', 'Initialisation du manager');
    }

    /**
     * Point d'entrée principal
     */
    initAllStyles() {
        const start = performance.now();
        
        const results = [
            this.inject('chess-notification-styles', this.getNotificationCSS()),
            this.inject('chess-move-history-styles', this.getMoveHistoryCSS())
        ];

        const duration = (performance.now() - start).toFixed(2);
        const success = results.every(r => r === true);

        AppLogManager.log(this.canLog, success ? '✅' : '⚠️', 'Styles', 
            `Injection terminée en ${duration}ms (${results.filter(Boolean).length}/2 ok)`);
            
        return success;
    }

    /**
     * Méthode générique d'injection pour éviter la répétition
     */
    inject(id, css) {
        if (document.getElementById(id)) {
            AppLogManager.log(this.canLog, 'ℹ️', 'Styles', `Style [${id}] déjà présent.`);
            return true;
        }

        try {
            const style = document.createElement('style');
            style.id = id;
            style.textContent = css;
            document.head.appendChild(style);
            AppLogManager.log(this.canLog, '📝', 'Styles', `Injection réussie : ${id}`);
            return true;
        } catch (e) {
            AppLogManager.log(this.canLog, '❌', 'Styles', `Erreur injection ${id}`, e);
            return false;
        }
    }

    // --- DICTIONNAIRE CSS ---

    getNotificationCSS() {
        return `
            .chess-notification {
                position: fixed; top: 20px; right: 20px;
                padding: 15px 20px; border-radius: 8px;
                color: white; font-weight: bold; z-index: 1000;
                animation: slideIn 0.3s ease-out;
                max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .chess-notification.success { background: #28a745; }
            .chess-notification.error { background: #dc3545; }
            .chess-notification.info { background: #17a2b8; }
            .chess-notification.warning { background: #ffc107; color: #212529; }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
    }

    getMoveHistoryCSS() {
        return `
            .move-history-container {
                font-family: sans-serif; font-size: 14px;
                max-height: 400px; overflow-y: auto;
                border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;
            }
            .move-row {
                display: flex; align-items: center; padding: 8px 12px;
                border-bottom: 1px solid #e8e8e8; cursor: pointer; transition: 0.2s;
            }
            .move-row:hover { background-color: #f0f8ff; }
            .move-row.selected { background-color: #007bff !important; color: white !important; }
            .move-number { color: #666; font-weight: 600; min-width: 28px; }
            .white-move { color: #2c3e50; font-weight: 600; min-width: 80px; }
            .black-move { color: #7f8c8d; font-weight: 600; min-width: 80px; }
            @media (max-width: 768px) {
                .move-history-container { max-height: 300px; }
                .white-move, .black-move { min-width: 70px; }
            }
        `;
    }
}

window.ChessStyleManager = ChessStyleManager;