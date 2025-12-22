// check/checkChessMat.js - Extension du moteur de vérification
// Cette classe hérite de ChessEngine qui contient déjà toute la logique robuste.
class ChessMateEngine extends ChessEngine {
    
    static VERSION = '1.3.5'; 
    static consoleLog = true;
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log(`♔ ChessMateEngine v${this.VERSION} actif (Héritage direct de ChessEngine)`);
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
     * Utilise la logique de capture déjà présente dans ChessEngine.
     * On ne ré-écrit pas isMoveLegal ici, car super.isMoveLegal est plus performant.
     */

    // Alias pratique si vous utilisez des objets pièces au lieu de caractères dans votre UI
    _getPieceChar(piece) {
        if (!piece) return null;
        if (typeof piece === 'string') return piece;
        const typeMap = { 'pawn': 'p', 'knight': 'n', 'bishop': 'b', 'rook': 'r', 'queen': 'q', 'king': 'k' };
        let char = typeMap[piece.type] || 'p';
        return piece.color === 'white' ? char.toUpperCase() : char.toLowerCase();
    }

    /**
     * Diagnostic détaillé pour la console
     */
    debugStatus(color) {
        const side = (color === 'white' || color === 'w') ? 'w' : 'b';
        const inCheck = this.isKingInCheck(side);
        const hasMoves = this.hasAnyLegalMoves(side);
        
        console.table({
            "Couleur": side,
            "En Échec": inCheck,
            "Coups Légaux": hasMoves,
            "Résultat": inCheck ? (hasMoves ? "Échec simple" : "MAT") : (hasMoves ? "En cours" : "PAT")
        });
        
        return this.checkGameStatus(side);
    }
}

ChessMateEngine.init();
window.ChessMateEngine = ChessMateEngine;