/**
 * js/kchess/check/checkChessPat.js - Version 1.4.0
 * MOTEUR DE DÉTECTION DU PAT (STALEMATE)
 */

class ChessPatEngine extends ChessEngine {
    
    static VERSION = '1.4.0';
    static consoleLog = true;

    static log(message, type = 'info') {
        if (!this.consoleLog && type === 'info') return;
        const icons = { info: '♟️', success: '✅', stalemate: '🚫' };
        console.log(`${icons[type] || '⚪'} [PatEngine] ${message}`);
    }

    static init() {
        this.loadConfig();
        this.log(`v${this.VERSION} prêt (Mode Optimisé)`, 'success');
    }

    static loadConfig() {
        try {
            const config = window.appConfig?.debug || window.appConfig?.chess_engine;
            if (config?.console_log !== undefined) {
                this.consoleLog = String(config.console_log).toLowerCase() !== "false";
            }
        } catch (e) { this.consoleLog = true; }
    }

    constructor(fen) {
        super(fen);
    }

    /**
     * Vérifie si la position actuelle est un Pat.
     * @param {string} color - 'white'/'black' ou 'w'/'b'
     */
    isStalemate(color) {
        const side = (color === 'white' || color === 'w') ? 'w' : 'b';
        
        // La méthode checkGameStatus du parent doit retourner 'stalemate' 
        // si le roi n'est pas en échec ET qu'aucun coup n'est possible.
        const status = this.checkGameStatus(side);
        const detected = (status === 'stalemate');

        if (detected) {
            this.constructor.log(`PAT détecté pour les ${side === 'w' ? 'Blancs' : 'Noirs'}`, 'stalemate');
        }

        return detected;
    }
}

// Initialisation
ChessPatEngine.init();
window.ChessPatEngine = ChessPatEngine;