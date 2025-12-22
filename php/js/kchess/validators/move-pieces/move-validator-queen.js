// validators/move-pieces/move-validator-queen.js
if (typeof QueenMoveValidator !== 'undefined') {
    console.warn('⚠️ QueenMoveValidator existe déjà.');
} else {

class QueenMoveValidator {
    
    static consoleLog = true; 
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log('👑 QueenMoveValidator: Système de composition (Fou + Tour) initialisé');
        }
    }
    
    static loadConfig() {
        try {
            if (window.appConfig?.chess_engine) {
                this.consoleLog = window.appConfig.chess_engine.console_log ?? true;
            }
        } catch (error) { this.consoleLog = true; }
    }

    constructor(board, gameState) {
        this.board = board;
        this.gameState = gameState;

        // --- PONT DE COMPATIBILITÉ (CRUCIAL) ---
        if (this.board && !this.board.getPiece) {
            this.board.getPiece = (r, c) => {
                if (typeof this.board.getSquare === 'function') {
                    const square = this.board.getSquare(r, c);
                    return square ? square.piece : null;
                }
                return null;
            };
        }
    }

    /**
     * La Reine combine les diagonales du Fou et les lignes de la Tour
     */
    getPossibleMoves(piece, row, col) {
        if (this.constructor.consoleLog) {
            console.group(`\n👑🔍 Analyse Reine ${piece.color} en [${row},${col}]`);
        }

        let allMoves = [];

        try {
            // Composition : La Reine est un Fou + une Tour
            // On instancie les validateurs requis dynamiquement
            const bishopValidator = typeof BishopMoveValidator !== 'undefined' 
                ? new BishopMoveValidator(this.board, this.gameState) 
                : null;
                
            const rookValidator = typeof RookMoveValidator !== 'undefined' 
                ? new RookMoveValidator(this.board, this.gameState) 
                : null;

            if (!bishopValidator || !rookValidator) {
                console.error("❌ QueenValidator : BishopMoveValidator ou RookMoveValidator manquant.");
                return [];
            }

            // Récupération des deux types de mouvements
            const bishopMoves = bishopValidator.getPossibleMoves(piece, row, col);
            const rookMoves = rookValidator.getPossibleMoves(piece, row, col);

            // Fusion des résultats
            allMoves = [...bishopMoves, ...rookMoves];

            if (this.constructor.consoleLog) {
                console.log(`👑 Composition : ${bishopMoves.length} diag (Fou) + ${rookMoves.length} lignes (Tour)`);
                console.log(`✅ Total : ${allMoves.length} coups.`);
            }
        } catch (error) {
            console.error("❌ Erreur lors de la composition des mouvements de la Reine:", error);
        }

        if (this.constructor.consoleLog) {
            console.groupEnd();
        }
        
        return allMoves;
    }
}

QueenMoveValidator.init();
window.QueenMoveValidator = QueenMoveValidator;

}