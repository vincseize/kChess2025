/**
 * js/kchess/check/checkChessMat.js - Version 1.4.1
 * MOTEUR DE DÉTECTION D'ÉCHEC ET MAT (CHECKMATE)
 * Correction : Suppression de la récursion infinie avec checkGameStatus
 */

class ChessMateEngine extends ChessEngine {
    
    static VERSION = '1.4.1';
    static consoleLog = true;

    static log(message, type = 'info') {
        if (!this.consoleLog && type === 'info') return;
        const icons = { info: '♔', success: '✅', check: '⚔️', mate: '💀' };
        console.log(`${icons[type] || '⚪'} [MateEngine] ${message}`);
    }

    static init() {
        this.loadConfig();
        this.log(`v${this.VERSION} actif (Héritage ChessEngine)`, 'success');
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
     * Détermine si la couleur donnée est en échec et mat.
     * Correction : Accès direct aux méthodes logiques pour éviter la récursion.
     */
    isCheckmate(color) {
        const side = (color === 'white' || color === 'w') ? 'w' : 'b';
        
        // 1. Vérifie si le roi est en échec
        const inCheck = this.isKingInCheck(side);
        
        // 2. Si pas d'échec, pas de mat possible (évite les calculs de coups inutiles)
        if (!inCheck) return false;

        // 3. Si échec, on vérifie s'il existe au moins un coup légal
        // Appel direct à ChessEngine.hasAnyLegalMoves
        const hasMoves = this.hasAnyLegalMoves(side);
        const detected = inCheck && !hasMoves;

        if (detected) {
            this.constructor.log(`MAT détecté pour les ${side === 'w' ? 'Blancs' : 'Noirs'} !`, 'mate');
        }

        return detected;
    }

    /**
     * Diagnostic détaillé sans risque de boucle infinie
     */
    debugStatus(color) {
        const side = (color === 'white' || color === 'w') ? 'w' : 'b';
        
        // On calcule les composants séparément
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