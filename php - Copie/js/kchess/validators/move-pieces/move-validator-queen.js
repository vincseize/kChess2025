// validators/move-pieces/move-validator-queen.js
if (typeof QueenMoveValidator !== 'undefined') {
    console.warn('⚠️ QueenMoveValidator existe déjà.');
} else {

class QueenMoveValidator {
    
    static consoleLog = true; 
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log('👑 QueenMoveValidator: Système de composition (Fou + Tour) prêt');
        }
    }
    
    static loadConfig() {
        try {
            if (window.appConfig?.chess_engine) {
                this.consoleLog = window.appConfig.chess_engine.console_log ?? true;
            } else if (window.chessConfig) {
                this.consoleLog = window.chessConfig.debug ?? true;
            }
        } catch (error) { this.consoleLog = true; }
    }

    constructor(board, gameState) {
        this.board = board;
        this.gameState = gameState;

        // --- PONT DE COMPATIBILITÉ ---
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
            // 1. Vérification de la présence des validateurs composants
            const hasBishop = typeof BishopMoveValidator !== 'undefined';
            const hasRook = typeof RookMoveValidator !== 'undefined';

            if (!hasBishop || !hasRook) {
                console.error("❌ QueenValidator : Composants manquants. Vérifiez l'ordre de chargement des scripts.");
                if (this.constructor.consoleLog) console.groupEnd();
                return [];
            }

            // 2. Instanciation
            const bishopValidator = new BishopMoveValidator(this.board, this.gameState);
            const rookValidator = new RookMoveValidator(this.board, this.gameState);

            // 3. Récupération avec sécurité (si l'un crash, l'autre peut encore fonctionner)
            let bishopMoves = [];
            let rookMoves = [];

            try {
                bishopMoves = bishopValidator.getPossibleMoves(piece, row, col);
            } catch (e) {
                console.error("⚠️ Crash partiel Reine (Composant Fou):", e);
            }

            try {
                rookMoves = rookValidator.getPossibleMoves(piece, row, col);
            } catch (e) {
                console.error("⚠️ Crash partiel Reine (Composant Tour):", e);
            }

            // 4. Fusion
            allMoves = [...bishopMoves, ...rookMoves];

            if (this.constructor.consoleLog) {
                console.log(`👑 Composition : ${bishopMoves.length} diag + ${rookMoves.length} lignes. Total : ${allMoves.length}`);
            }

        } catch (error) {
            console.error("❌ Erreur critique QueenValidator:", error);
            // On renvoie un tableau vide pour éviter de faire planter le moteur global, 
            // mais le fail-safe des composants individuels devrait déjà avoir agi.
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