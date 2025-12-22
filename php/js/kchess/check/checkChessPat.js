// check/checkChessPat.js - Moteur de détection du Pat (Stalemate)
class ChessPatEngine extends ChessEngine {
    
    static VERSION = '1.3.2';
    static consoleLog = true;

    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log(`♟️ ChessPatEngine v${this.VERSION} prêt (Mode Optimisé)`);
        }
    }

    static loadConfig() {
        try {
            const rawValue = window.appConfig?.debug?.console_log ?? true;
            this.consoleLog = rawValue === "false" ? false : Boolean(rawValue);
        } catch (e) {
            this.consoleLog = true;
        }
    }

    constructor(fen) {
        super(fen);
    }

    /**
     * Vérifie si la position actuelle est un Pat.
     * Utilise directement la logique robuste de ChessEngine.
     */
    isStalemate(color) {
        const side = (color === 'white' || color === 'w') ? 'w' : 'b';
        
        // La méthode checkGameStatus du parent gère déjà parfaitement l'ordre :
        // 1. Si échec -> Pas de Pat possible.
        // 2. Si pas d'échec et aucun coup -> Pat.
        const result = this.checkGameStatus(side);
        const detected = (result === 'stalemate');

        if (detected && ChessPatEngine.consoleLog) {
            console.log(`♟️✅ PAT détecté pour les ${side === 'w' ? 'Blancs' : 'Noirs'}`);
        }

        return detected;
    }
}

// Initialisation
ChessPatEngine.init();
window.ChessPatEngine = ChessPatEngine;