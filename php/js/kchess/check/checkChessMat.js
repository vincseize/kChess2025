/**
 * js/kchess/check/checkChessMat.js - Version 1.4.2
 * MOTEUR DE DÉTECTION D'ÉCHEC ET MAT (CHECKMATE)
 * Mise à jour : Logique d'initialisation BotCore & Config Synchrone
 */

class ChessMateEngine extends ChessEngine {
    
    static VERSION = '1.4.2';
    static consoleLog = false;
    static initialized = false;

    /**
     * Initialisation statique (identique à BotCore pour la cohérence)
     */
    static init() {
        this.loadConfig();
        this.initialized = true;
        
        if (this.consoleLog) {
            console.log(`⚔️ [MateEngine] v${this.VERSION} prêt (Debug ON)`);
        }
    }

    /**
     * Charge la configuration depuis window.appConfig ou window.getConfig
     */
    static loadConfig() {
        try {
            let configValue = false;
            if (window.appConfig && window.appConfig.debug) {
                configValue = window.appConfig.debug.console_log;
            } else if (typeof window.getConfig === 'function') {
                configValue = window.getConfig('debug.console_log', false);
            }
            // Normalisation en booléen
            this.consoleLog = (configValue === true || configValue === "true");
            return true;
        } catch (e) {
            this.consoleLog = false;
            return false;
        }
    }

    /**
     * Logger interne respectant le flag consoleLog
     */
    static log(message, type = 'info') {
        if (!this.consoleLog && type === 'info') return;
        const icons = { info: '♔', success: '✅', check: '⚔️', mate: '💀' };
        console.log(`${icons[type] || '⚪'} [MateEngine] ${message}`);
    }

    constructor(fen) {
        super(fen);
    }

    /**
     * Détermine si la couleur donnée est en échec et mat.
     */
    isCheckmate(color) {
        const side = (color === 'white' || color === 'w') ? 'w' : 'b';
        
        // 1. Vérifie si le roi est en échec
        const inCheck = this.isKingInCheck(side);
        
        // 2. Si pas d'échec, pas de mat possible
        if (!inCheck) return false;

        // 3. Si échec, vérifie l'absence de coups légaux
        const hasMoves = this.hasAnyLegalMoves(side);
        const detected = inCheck && !hasMoves;

        if (detected) {
            // Détermination du vainqueur (l'opposé de 'side')
            const winner = (side === 'w') ? 'Noirs' : 'Blancs';
            const loser = (side === 'w') ? 'Blancs' : 'Noirs';
            
            this.constructor.log(`MAT détecté pour les ${loser}. ${winner} gagnent!`, 'mate');
        }

        return detected;
    }

    /**
     * Diagnostic complet pour console.table
     */
    debugStatus(color) {
        const side = (color === 'white' || color === 'w') ? 'w' : 'b';
        
        const inCheck = this.isKingInCheck(side);
        const hasMoves = this.hasAnyLegalMoves(side);
        
        let resultText = "";
        if (inCheck) {
            resultText = hasMoves ? "Échec au Roi" : "ÉCHEC ET MAT 💀";
        } else {
            resultText = hasMoves ? "Partie en cours" : "PAT (Stalemate) 🤝";
        }

        console.table({
            "Moteur": "ChessMateEngine",
            "Version": ChessMateEngine.VERSION,
            "Joueur": side === 'w' ? "Blanc" : "Noir",
            "En Échec": inCheck ? "OUI ⚔️" : "NON",
            "Coups Légaux": hasMoves ? "OUI" : "AUCUN 🚫",
            "Résultat": resultText
        });
        
        return { inCheck, hasMoves, result: resultText };
    }

    /**
     * Utilitaire de conversion (statique ou d'instance)
     */
    _getPieceChar(piece) {
        if (!piece) return null;
        if (typeof piece === 'string') return piece;
        const typeMap = { 'pawn': 'p', 'knight': 'n', 'bishop': 'b', 'rook': 'r', 'queen': 'q', 'king': 'k' };
        let char = typeMap[piece.type] || 'p';
        return piece.color === 'white' ? char.toUpperCase() : char.toLowerCase();
    }
}

// Lancement automatique
ChessMateEngine.init();
window.ChessMateEngine = ChessMateEngine;