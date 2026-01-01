// validators/move-handler-core.js
if (typeof ChessGameMoveHandler !== 'undefined') {
    console.warn('⚠️ ChessGameMoveHandler existe déjà.');
} else {

class ChessGameMoveHandler {
    
    static consoleLog = true; 
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) console.log('🎮 ChessGameMoveHandler: Système prêt');
    }
    
    static loadConfig() {
        try {
            if (window.appConfig?.chess_engine) {
                this.consoleLog = window.appConfig.chess_engine.console_log ?? true;
            }
        } catch (e) { this.consoleLog = true; }
    }

    constructor(game) {
        this.game = game;
        this.isPromoting = false; 
        
        // Utiliser l'exécuteur déjà présent dans le core s'il existe, sinon en créer un
        this.moveExecutor = game.moveExecutor || new MoveExecutor(game);
        
        this.moveStateManager = (typeof MoveStateManager !== 'undefined') ? new MoveStateManager(game) : null;
    }

    // ========== GESTION DES CLICS ==========

    handleSquareClick(displayRow, displayCol, isDirect = false) {
        if (!this.validateGameState()) return;
        
        const { actualRow, actualCol, square } = this.getActualSquare(displayRow, displayCol, isDirect);
        
        if (!square) return;

        if (this.constructor.consoleLog) {
            console.group(`🎯 Clic [${actualRow}, ${actualCol}] (Origine: ${isDirect ? 'IA' : 'Humain'})`);
        }

        const selectedPiece = this.game.selectedPiece;

        if (selectedPiece) {
            this.handleMovementPhase(actualRow, actualCol, square);
        } else {
            this.handleSelectionPhase(actualRow, actualCol, square);
        }

        if (this.constructor.consoleLog) console.groupEnd();
    }

    handleSelectionPhase(row, col, square) {
        const piece = square.piece;
        const currentPlayer = this.game.gameState.currentPlayer;
        
        if (piece && piece.color === currentPlayer) {
            if (this.constructor.consoleLog) console.log(`✅ Sélection : ${piece.color} ${piece.type}`);
            
            if (this.moveStateManager) {
                this.moveStateManager.handlePieceSelection(row, col, square);
            }
        } else {
            this.clearSelection();
        }
    }

    handleMovementPhase(row, col, square) {
        const selectedPiece = this.game.selectedPiece;

        if (selectedPiece.row === row && selectedPiece.col === col) {
            this.clearSelection();
            return;
        }

        if (square.piece && square.piece.color === this.game.gameState.currentPlayer) {
            this.handleSelectionPhase(row, col, square);
            return;
        }

        const isPossible = this.game.possibleMoves?.some(m => m.row === row && m.col === col);
        
        if (isPossible) {
            this.executeMove(row, col);
        } else {
            this.clearSelection();
        }
    }

    // ========== EXÉCUTION ==========

    executeMove(toRow, toCol) {
        // Sécurité : Vérifier si la fonction existe sur l'instance
        if (typeof this.moveExecutor.prepareMoveExecution !== 'function') {
            console.error("❌ Erreur critique : prepareMoveExecution introuvable sur MoveExecutor.", this.moveExecutor);
            return;
        }

        const moveData = this.moveExecutor.prepareMoveExecution(toRow, toCol);
        
        if (moveData) {
            this.isPromoting = true; 

            try {
                this.moveExecutor.executeNormalMove(
                    moveData.fromSquare, 
                    moveData.toSquare, 
                    moveData.selectedPiece, 
                    moveData.move, 
                    toRow, 
                    toCol
                );
            } finally {
                // On ne débloque le drapeau que si ce n'est pas une promotion (qui attend un clic modale)
                if (!moveData.move?.isPromotion) {
                    this.isPromoting = false;
                }
            }
        }
    }

    // ========== UTILITAIRES ==========

    validateGameState() {
        if (!this.game.gameState?.gameActive) return false;
        if (this.isPromoting) return false;
        return true;
    }

    getActualSquare(displayRow, displayCol, isDirect = false) {
        let actualRow = displayRow;
        let actualCol = displayCol;

        if (!isDirect && this.game.gameState.boardFlipped) {
            actualRow = 7 - displayRow;
            actualCol = 7 - displayCol;
        }

        const square = this.game.board.getSquare(actualRow, actualCol);
        return { actualRow, actualCol, square };
    }

    clearSelection() {
        this.game.clearSelection?.(); 
        if (this.moveStateManager?.clearSelection) {
            this.moveStateManager.clearSelection();
        }
    }
}

ChessGameMoveHandler.init();
window.ChessGameMoveHandler = ChessGameMoveHandler;

}